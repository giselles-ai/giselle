import { isTextGenerationNode } from "@giselle-ai/data-type";
import { useCallback, useEffect, useRef } from "react";
import {
	type Generation,
	GenerationContext,
	isQueuedGeneration,
	type RunningGeneration,
} from "../../concepts/generation";
import { useGiselleEngine } from "../use-giselle-engine";
import { useGenerationRunnerSystem } from "./contexts/generation-runner-system";
import { GenerateContentRunner } from "./generate-content-runner";

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
	const { updateGenerationListener } = useGenerationRunnerSystem();
	const handleStart = useCallback(
		(generation: RunningGeneration) => {
			updateGenerationListener(generation);
		},
		[updateGenerationListener],
	);

	if (generation.status === "created") {
		return null;
	}
	const generationContext = GenerationContext.parse(generation.context);
	if (!isTextGenerationNode(generationContext.operationNode)) {
		throw new Error("Invalid generation type");
	}
	return (
		<GenerateContentRunner generation={generation} onStart={handleStart} />
	);
}

function ImageGenerationRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		updateGenerationStatusToFailure,
		addStopHandler,
	} = useGenerationRunnerSystem();
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
			})
			.then(async () => {
				updateGenerationStatusToRunning(generation.id);

				try {
					await client.generateImage(
						{
							generation,
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
			})
			.then(() => {
				updateGenerationStatusToRunning(generation.id);
				client
					.resolveTrigger({
						generation,
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
