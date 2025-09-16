import { useChat } from "@ai-sdk/react";
import { isTextGenerationNode } from "@giselle-sdk/data-type";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef } from "react";
import {
	type Generation,
	GenerationContext,
	isQueuedGeneration,
} from "../../concepts/generation";
import { useFeatureFlag } from "../feature-flags";
import { useGiselleEngine } from "../use-giselle-engine";
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
export function GenerationRunner({ generation }: { generation: Generation }) {
	if (generation.status === "created") {
		return null;
	}
	const generationContext = GenerationContext.parse(generation.context);
	switch (generationContext.operationNode.content.type) {
		case "textGeneration":
			return <TextGenerationRunner generation={generation} />;
		case "imageGeneration":
			return <ImageGenerationRunner generation={generation} />;
		case "trigger":
			return <TriggerRunner generation={generation} />;
		case "action":
			return <ActionRunner generation={generation} />;
		case "query":
			return <QueryRunner generation={generation} />;
		default: {
			const _exhaustiveCheck: never = generationContext.operationNode.content;
			return _exhaustiveCheck;
		}
	}
}

function TextGenerationRunner({ generation }: { generation: Generation }) {
	if (generation.status === "created") {
		return null;
	}
	const generationContext = GenerationContext.parse(generation.context);
	if (!isTextGenerationNode(generationContext.operationNode)) {
		throw new Error("Invalid generation type");
	}
	const content = generationContext.operationNode.content;
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

function CompletionRunner({ generation }: { generation: Generation }) {
	const { experimental_storage, aiGateway, resumableGeneration } =
		useFeatureFlag();
	const client = useGiselleEngine();
	const {
		generateTextApi,
		updateGenerationStatusToRunning,
		updateGenerationStatusToComplete,
		updateGenerationStatusToFailure,
		updateMessages,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const { messages, sendMessage, stop, status } = useChat({
		transport: new DefaultChatTransport({
			api: generateTextApi,
			body: {
				generation,
				useExperimentalStorage: experimental_storage,
				useAiGateway: aiGateway,
				useResumableGeneration: resumableGeneration,
			},
		}),
		onFinish: async () => {
			await updateGenerationStatusToComplete(generation.id);
		},
		onError: async () => {
			await updateGenerationStatusToFailure(generation.id);
		},
	});
	useEffect(() => {
		if (status !== "streaming") {
			return;
		}
		updateGenerationStatusToRunning(generation.id);
	}, [status, updateGenerationStatusToRunning, generation.id]);
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
		sendMessage({ role: "user", parts: [] });
		client.generateContent({ generation });
	});
	return null;
}

function ImageGenerationRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		updateGenerationStatusToFailure,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const { experimental_storage } = useFeatureFlag();
	const client = useGiselleEngine();
	const abortControllerRef = useRef<AbortController | null>(null);

	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
	}, []);

	useOnce(() => {
		if (!isQueuedGeneration(generation)) {
			return;
		}
		addStopHandler(generation.id, stop);

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		client
			.setGeneration({
				generation,
				useExperimentalStorage: experimental_storage,
			})
			.then(async () => {
				updateGenerationStatusToRunning(generation.id);

				try {
					await client.generateImage(
						{
							generation,
							useExperimentalStorage: experimental_storage,
						},
						{ signal: abortController.signal },
					);
					updateGenerationStatusToComplete(generation.id);
				} catch (error) {
					if (
						error instanceof DOMException &&
						error.name === "AbortError" &&
						abortController.signal.aborted
					) {
						return;
					}

					console.error("Failed to generate image:", error);
					updateGenerationStatusToFailure(generation.id);
				}
			})
			.catch((error) => {
				console.error("Failed to set generation:", error);
				updateGenerationStatusToFailure(generation.id);
			})
			.finally(() => {
				abortControllerRef.current = null;
			});
	});
	return null;
}

function TriggerRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const { experimental_storage } = useFeatureFlag();
	const client = useGiselleEngine();
	const stop = () => {};
	useOnce(() => {
		if (!isQueuedGeneration(generation)) {
			return;
		}
		addStopHandler(generation.id, stop);
		client
			.setGeneration({
				generation,
				useExperimentalStorage: experimental_storage,
			})
			.then(() => {
				updateGenerationStatusToRunning(generation.id);
				client
					.resolveTrigger({
						generation,
						useExperimentalStorage: experimental_storage,
					})
					.then(() => {
						updateGenerationStatusToComplete(generation.id);
					});
			});
	});
	return null;
}

function ActionRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const { experimental_storage } = useFeatureFlag();
	const client = useGiselleEngine();
	const stop = () => {};
	useOnce(() => {
		if (!isQueuedGeneration(generation)) {
			return;
		}
		addStopHandler(generation.id, stop);
		client
			.setGeneration({
				generation,
				useExperimentalStorage: experimental_storage,
			})
			.then(() => {
				updateGenerationStatusToRunning(generation.id);
				client
					.executeAction({
						generation,
					})
					.then(() => {
						updateGenerationStatusToComplete(generation.id);
					});
			});
	});
	return null;
}

function QueryRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		updateGenerationStatusToFailure,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const { experimental_storage } = useFeatureFlag();
	const client = useGiselleEngine();
	const stop = () => {};
	useOnce(() => {
		if (!isQueuedGeneration(generation)) {
			return;
		}
		addStopHandler(generation.id, stop);
		client
			.setGeneration({
				generation,
				useExperimentalStorage: experimental_storage,
			})
			.then(() => {
				updateGenerationStatusToRunning(generation.id);
				client
					.executeQuery({
						generation,
					})
					.then(() => {
						updateGenerationStatusToComplete(generation.id);
					})
					.catch((error) => {
						console.error("Query execution failed:", error);
						updateGenerationStatusToFailure(generation.id);
					});
			})
			.catch((error) => {
				console.error("Failed to set generation:", error);
				updateGenerationStatusToFailure(generation.id);
			});
	});
	return null;
}
