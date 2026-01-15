import type { GiselleLogger } from "@giselles-ai/logger";
import {
	type Generation,
	type GenerationId,
	isCompletedGeneration,
	isFailedGeneration,
	type QueuedGeneration,
	type Sequence,
	TaskId,
} from "@giselles-ai/protocol";
import * as z from "zod/v4";
import {
	type GenerationMetadata,
	generateImage,
	getGeneration,
	type OnGenerationComplete,
	type OnGenerationError,
} from "../generations";
import { startContentGeneration } from "../generations/start-content-generation";
import { executeAction } from "../operations";
import { executeQuery } from "../operations/execute-query";
import { resolveTrigger } from "../triggers";
import type { GiselleContext } from "../types";
import { getTask } from "./get-task";
import { createPatchQueue } from "./patch-queue";
import { executeTask } from "./shared/task-execution-utils";

async function waitUntilGenerationFinishes(args: {
	context: GiselleContext;
	generationId: GenerationId;
}) {
	while (true) {
		const generation = await getGeneration({
			context: args.context,
			generationId: args.generationId,
		});

		if (!generation) {
			throw new Error(`Generation(id: ${args.generationId}) is not found`);
		}

		if (
			generation.status === "completed" ||
			generation.status === "failed" ||
			generation.status === "cancelled"
		) {
			return generation;
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

export interface RunTaskCallbacks {
	sequenceStart?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceFail?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceComplete?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceSkip?: (args: { sequence: Sequence }) => void | Promise<void>;
}

async function executeStep(args: {
	context: GiselleContext;
	generation: QueuedGeneration;
	callbacks?: {
		onCompleted?: () => void | Promise<void>;
		onFailed?: (generation: Generation) => void | Promise<void>;
		onGenerationComplete?: OnGenerationComplete;
		onGenerationError?: OnGenerationError;
	};
	logger?: GiselleLogger;
	metadata?: GenerationMetadata;
}) {
	try {
		switch (args.generation.context.operationNode.content.type) {
			case "action":
				await executeAction(args);
				break;
			case "imageGeneration":
				await generateImage({ ...args });
				break;
			case "textGeneration":
			case "contentGeneration": {
				await startContentGeneration({
					generation: args.generation,
					context: args.context,
					metadata: args.metadata,
					onComplete: args.callbacks?.onGenerationComplete,
					onError: args.callbacks?.onGenerationError,
				});
				const finishedGeneration = await waitUntilGenerationFinishes({
					context: args.context,
					generationId: args.generation.id,
				});
				if (isFailedGeneration(finishedGeneration)) {
					await args.callbacks?.onFailed?.(finishedGeneration);
				}
				if (isCompletedGeneration(finishedGeneration)) {
					await args.callbacks?.onCompleted?.();
				}
				break;
			}
			case "trigger":
				await resolveTrigger({
					context: args.context,
					generation: args.generation,
				});
				break;
			case "query":
				await executeQuery(args);
				break;
			case "dataQuery":
				// TODO: implement executeDataQuery
				break;
			case "appEntry":
				break;
			case "end":
				break;
			default: {
				const _exhaustiveCheck: never =
					args.generation.context.operationNode.content.type;
				throw new Error(`Unhandled step type: ${_exhaustiveCheck}`);
			}
		}
		await args.callbacks?.onCompleted?.();
	} catch (_e) {
		console.log(_e);
		await args.callbacks?.onFailed?.(args.generation);
	}
}

export const RunTaskInputs = z.object({
	taskId: TaskId.schema,
	callbacks: z.optional(z.custom<RunTaskCallbacks>()),
	logger: z.optional(z.custom<GiselleLogger>()),
	metadata: z.optional(z.custom<GenerationMetadata>()),
});
export type RunTaskInputs = z.infer<typeof RunTaskInputs>;

export async function runTask(
	args: RunTaskInputs & {
		context: GiselleContext;
		onGenerationComplete?: OnGenerationComplete;
		onGenerationError?: OnGenerationError;
	},
) {
	const task = await getTask(args);

	// Create patch queue for this task execution
	const patchQueue = createPatchQueue(args.context);
	const applyPatches = patchQueue.createApplyPatches();

	let executionError: Error | null = null;
	try {
		await executeTask({
			task,
			applyPatches,
			startGeneration: async (generationId, callbacks) => {
				const generation = await getGeneration({
					context: args.context,
					generationId,
				});
				if (!generation || generation.status !== "created") {
					return;
				}
				const queuedGeneration: QueuedGeneration = {
					...generation,
					status: "queued",
					queuedAt: Date.now(),
				};
				await executeStep({
					context: args.context,
					generation: queuedGeneration,
					callbacks: {
						...callbacks,
						onGenerationComplete: args.onGenerationComplete,
						onGenerationError: args.onGenerationError,
					},
					metadata: args.metadata,
				});
			},
			onSequenceStart: async (sequence) => {
				args.context.logger.debug(
					{ sequence },
					`Starting sequence ${sequence.id}`,
				);
				await args.callbacks?.sequenceStart?.({ sequence });
			},
			onSequenceError: async (sequence) => {
				args.context.logger.error(
					{ sequence },
					`Sequence ${sequence.id} failed`,
				);
				await args.callbacks?.sequenceFail?.({ sequence });
			},
			onSequenceComplete: async (sequence) => {
				args.context.logger.debug(
					{ sequence },
					`Sequence ${sequence.id} completed`,
				);
				await args.callbacks?.sequenceComplete?.({ sequence });
			},
			onSequenceSkip: async (sequence) => {
				args.context.logger.debug(
					{ sequence },
					`Skipping sequence ${sequence.id}`,
				);
				await args.callbacks?.sequenceSkip?.({ sequence });
			},
			onTaskComplete: async () => {
				await patchQueue.flush();
			},
		});
	} catch (error) {
		executionError = error as Error;
	}

	patchQueue.cleanup();
	if (executionError !== null) {
		console.error("Execution failed:", executionError);
		throw executionError;
	}
}
