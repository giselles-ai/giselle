import { useChat } from "@ai-sdk/react";
import type {
	CancelledGeneration,
	CompletedGeneration,
	FailedGeneration,
	Generation,
	QueuedGeneration,
	RunningGeneration,
} from "@giselle-sdk/data-type";
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
		case "imageGeneration":
			return <ImageGenerationRunner generation={generation} />;
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
		case "perplexity":
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
		| RunningGeneration
		| CompletedGeneration
		| FailedGeneration
		| CancelledGeneration;
}) {
	const {
		generateTextApi,
		updateGenerationStatusToRunning,
		updateGenerationStatusToComplete,
		updateGenerationStatusToFailure,
		updateMessages,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const { messages, append, stop } = useChat({
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
		addStopHandler(generation.id, stop);
		append(
			{ role: "user", content: "hello" },
			{
				body: {
					generation,
				},
			},
		);
	});
	return null;
}

function ImageGenerationRunner({
	generation,
}: {
	generation: Generation;
}) {
	return null;
}
