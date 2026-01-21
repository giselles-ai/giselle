import {
	type Generation,
	GenerationContext,
	isCompletedGeneration,
	isContentGenerationNode,
	isQueuedGeneration,
	isTextGenerationNode,
	type RunningGeneration,
} from "@giselles-ai/protocol";
import { useCallback, useEffect, useRef } from "react";
import { useGiselle } from "../use-giselle";
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
		case "contentGeneration":
			return <TextGenerationRunner generation={generation} />;
		case "imageGeneration":
			return <ImageGenerationRunner generation={generation} />;
		case "trigger":
			return <TriggerRunner generation={generation} />;
		case "action":
			return <ActionRunner generation={generation} />;
		case "query":
			return <QueryRunner generation={generation} />;
		case "dataQuery":
			return <DataQueryRunner generation={generation} />;
		case "appEntry": {
			console.warn(
				"start node runner was created. This is unintended behavior as start nodes do not require a runner.",
			);
			return null;
		}
		case "end":
			return null;
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
	if (
		!isTextGenerationNode(generationContext.operationNode) &&
		!isContentGenerationNode(generationContext.operationNode)
	) {
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
	const client = useGiselle();
	const stopRequestedRef = useRef(false);

	const stop = useCallback(() => {
		// Server Actions can't receive AbortSignal. Best-effort cancellation uses the
		// explicit cancel API instead of aborting the transport layer.
		stopRequestedRef.current = true;
		void client.cancelGeneration({ generationId: generation.id });
	}, [client, generation.id]);

	useOnce(() => {
		if (!isQueuedGeneration(generation)) {
			return;
		}
		addStopHandler(generation.id, stop);

		client
			.setGeneration({
				generation,
			})
			.then(async () => {
				updateGenerationStatusToRunning(generation.id);

				try {
					await client.generateImage({
						generation,
					});
					if (stopRequestedRef.current) {
						// If the user requested stop, `stopGenerationRunner()` already set
						// the local state to `cancelled`. Avoid overwriting it with
						// `completed` due to this async chain finishing after cancellation.
						return;
					}
					updateGenerationStatusToComplete(generation.id);
				} catch (error) {
					if (stopRequestedRef.current) {
						// If the user requested stop, cancellation may surface as a
						// transport/Server Action error. In that case we treat it as
						// intentional and avoid turning `cancelled` into `failed`.
						//
						// TODO: Prefer making server-side cancellation a first-class outcome
						// (i.e. not throwing an error) so we can avoid surfacing noise in
						// logs/telemetry for intentional user cancellations.
						return;
					}
					console.error("Failed to generate image:", error);
					updateGenerationStatusToFailure(generation.id);
				}
			})
			.catch((error) => {
				if (stopRequestedRef.current) {
					// Same reasoning as above: don't let late failures overwrite an
					// intentional cancellation.
					return;
				}
				console.error("Failed to set generation:", error);
				updateGenerationStatusToFailure(generation.id);
			})
			.finally(() => {});
	});
	return null;
}

function TriggerRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const client = useGiselle();
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
	const client = useGiselle();
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
	const client = useGiselle();
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

function DataQueryRunner({ generation }: { generation: Generation }) {
	const {
		updateGenerationStatusToComplete,
		updateGenerationStatusToRunning,
		updateGenerationStatusToFailure,
		addStopHandler,
	} = useGenerationRunnerSystem();
	const client = useGiselle();
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
					.executeDataQuery({
						generation,
					})
					.then(async () => {
						// client.executeDataQuery no longer throws on user SQL errors.
						// Check the persisted generation status to determine outcome.
						const persistedGeneration = await client.getGeneration({
							generationId: generation.id,
						});
						if (isCompletedGeneration(persistedGeneration)) {
							updateGenerationStatusToComplete(generation.id);
						} else {
							updateGenerationStatusToFailure(generation.id);
						}
					})
					.catch((error) => {
						// Only unexpected errors (network, etc.) reach here
						console.error("Data query execution failed:", error);
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
