import type { GiselleLogger } from "@giselles-ai/logger";
import {
	ActId,
	type Generation,
	type GenerationId,
	isCompletedGeneration,
	isFailedGeneration,
	type QueuedGeneration,
	type Sequence,
} from "@giselles-ai/protocol";
import * as z from "zod/v4";
import type { GiselleEngineContext } from "../../contracts";
import {
	type GenerationMetadata,
	generateImage,
	getGeneration,
} from "../generations";
import { startContentGeneration } from "../generations/start-content-generation";
import { executeAction } from "../operations";
import { executeQuery } from "../operations/execute-query";
import { resolveTrigger } from "../triggers";
import { getAct } from "./get-act";
import { createPatchQueue } from "./patch-queue";
import { executeAct } from "./shared/act-execution-utils";

async function waitUntilGenerationFinishes(args: {
	context: GiselleEngineContext;
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

export interface RunActCallbacks {
	sequenceStart?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceFail?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceComplete?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceSkip?: (args: { sequence: Sequence }) => void | Promise<void>;
}

async function executeStep(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	callbacks?: {
		onCompleted?: () => void | Promise<void>;
		onFailed?: (generation: Generation) => void | Promise<void>;
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
			case "textGeneration": {
				await startContentGeneration(args);
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
			case "appEntry":
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

export const RunActInputs = z.object({
	actId: ActId.schema,
	callbacks: z.optional(z.custom<RunActCallbacks>()),
	logger: z.optional(z.custom<GiselleLogger>()),
	metadata: z.optional(z.custom<GenerationMetadata>()),
});
export type RunActInputs = z.infer<typeof RunActInputs>;

export async function runAct(
	args: RunActInputs & {
		context: GiselleEngineContext;
	},
) {
	const act = await getAct(args);

	// Create patch queue for this act execution
	const patchQueue = createPatchQueue(args.context);
	const applyPatches = patchQueue.createApplyPatches();

	let executionError: Error | null = null;
	try {
		await executeAct({
			act,
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
					callbacks,
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
			onActComplete: async () => {
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
