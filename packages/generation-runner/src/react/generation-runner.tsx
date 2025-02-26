import {
	type CompletedGeneration,
	type FailedGeneration,
	type Generation,
	type QueuedGeneration,
	type RequestedGeneration,
	type RunningGeneration,
	isGitHubNode,
} from "@giselle-sdk/data-type";
import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import { useGenerationRunnerSystem } from "./contexts/generation-runner-system";

function useOnce(fn: () => void) {
	const once = useRef(false);
	useEffect(() => {
		if (once.current) {
			return;
		}
		fn();
		once.current = true;
	}, [fn]);
}
export function GenerationRunner({
	generation,
}: {
	generation: Generation;
}) {
	if (generation.status === "created") {
		return null;
	}
	switch (generation.context.actionNode.content.type) {
		case "textGeneration":
			return <TextGenerationRunner generation={generation} />;
		case "github":
			return <GitHubRunner generation={generation} />;
		default: {
			const _exhaustiveCheck: never = generation.context.actionNode.content;
			return _exhaustiveCheck;
		}
	}
}

function TextGenerationRunner({
	generation,
}: {
	generation: Generation;
}) {
	if (generation.status === "created") {
		return null;
	}
	if (generation.context.actionNode.content.type !== "textGeneration") {
		throw new Error("Invalid generation type");
	}
	const content = generation.context.actionNode.content;
	switch (content.llm.provider) {
		case "openai":
		case "anthropic":
		case "google":
			return <CompletionRunner generation={generation} />;
		default: {
			const _exhaustiveCheck: never = content.llm;
			return _exhaustiveCheck;
		}
	}
}

function CompletionRunner({
	generation,
}: {
	generation:
		| QueuedGeneration
		| RequestedGeneration
		| RunningGeneration
		| CompletedGeneration
		| FailedGeneration;
}) {
	const {
		generateTextApi,
		requestGeneration,
		updateGenerationStatusToRunning,
		updateGenerationStatusToComplete,
		updateGenerationStatusToFailure,
		updateMessages,
	} = useGenerationRunnerSystem();
	const { messages, append } = useChat({
		api: generateTextApi,
		onFinish: async () => {
			await updateGenerationStatusToComplete(generation.id);
		},
		onResponse: async () => {
			await updateGenerationStatusToRunning(generation.id);
		},
		onError: async () => {
			await updateGenerationStatusToFailure(generation.id);
		},
	});
	useEffect(() => {
		if (generation.status !== "running") {
			return;
		}
		updateMessages(generation.id, messages);
	}, [messages, generation.status, updateMessages, generation.id]);
	useOnce(() => {
		if (generation.status !== "queued") {
			return;
		}
		requestGeneration(generation).then(() => {
			append(
				{ role: "user", content: "hello" },
				{
					body: {
						generationId: generation.id,
					},
				},
			);
		});
	});
	return null;
}

function GitHubRunner({
	generation,
}: {
	generation: Generation;
}) {
	if (generation.status === "created") {
		return null;
	}
	if (!isGitHubNode(generation.context.actionNode)) {
		throw new Error("Invalid generation type");
	}

	const {
		requestGeneration,
		updateGenerationStatusToComplete,
		updateGenerationStatusToFailure,
	} = useGenerationRunnerSystem();

	useOnce(async () => {
		if (generation.status !== "queued") {
			return;
		}
		try {
			await requestGeneration(generation);
			// FIXME
			const response = await fetch("/api/giselle/github-operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					generationId: generation.id,
				}),
			});
			if (!response.ok) {
				throw new Error(`GitHub operation failed: ${response.statusText}`);
			}
			await updateGenerationStatusToComplete(generation.id);
		} catch (error) {
			console.error("GitHub operation failed:", error);
			await updateGenerationStatusToFailure(generation.id);
		}
	});

	return null;
}
