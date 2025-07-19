import {
	type FailedGeneration,
	type GenerationContextInput,
	GenerationId,
	type QueuedGeneration,
	type RunId,
	type Sequence,
	type Workflow,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { AISDKError } from "ai";
import { generateImage, generateText, setGeneration } from "../generations";
import { executeAction } from "../operations";
import { executeQuery } from "../operations/execute-query";
import type { GiselleEngineContext } from "../types";
import { patchRun } from "./patch-run";
import { resolveTrigger } from "./resolve-trigger";
import type { FlowRunId } from "./run/object";

export interface RunFlowCallbacks {
	sequenceStart?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceFail?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceComplete?: (args: { sequence: Sequence }) => void | Promise<void>;
	sequenceSkip?: (args: { sequence: Sequence }) => void | Promise<void>;
}

function createQueuedGeneration(args: {
	step: Sequence["steps"][number];
	runId: RunId;
	workspaceId: WorkspaceId;
	triggerInputs?: GenerationContextInput[];
}) {
	const { step, runId, workspaceId, triggerInputs } = args;
	return {
		id: GenerationId.generate(),
		context: {
			operationNode: step.node,
			connections: step.connections,
			sourceNodes: step.sourceNodes,
			origin: { type: "run", id: runId, workspaceId },
			inputs: step.node.content.type === "trigger" ? (triggerInputs ?? []) : [],
		},
		status: "queued",
		createdAt: Date.now(),
		queuedAt: Date.now(),
	} satisfies QueuedGeneration;
}

async function executeStep(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	node: Sequence["steps"][number]["node"];
	flowRunId: FlowRunId;
	useExperimentalStorage: boolean;
}): Promise<boolean> {
	const { context, generation, node, flowRunId, useExperimentalStorage } = args;
	switch (node.content.type) {
		case "action":
			await executeAction({ context, generation });
			return false;
		case "imageGeneration":
			await generateImage({ context, generation, useExperimentalStorage });
			return false;
		case "textGeneration": {
			let hadError = false;
			const result = await generateText({
				context,
				generation,
				useExperimentalStorage,
			});
			await result.consumeStream({
				onError: async (error) => {
					hadError = true;
					if (AISDKError.isInstance(error)) {
						const failedGeneration = {
							...generation,
							status: "failed",
							startedAt: Date.now(),
							failedAt: Date.now(),
							messages: [],
							error: {
								name: error.name,
								message: error.message,
							},
						} satisfies FailedGeneration;
						await Promise.all([
							setGeneration({
								context,
								generation: failedGeneration,
								useExperimentalStorage,
							}),
							patchRun({
								context,
								flowRunId,
								delta: {
									annotations: {
										push: [
											{
												level: "error",
												message: error.message,
											},
										],
									},
								},
							}),
						]);
					}
				},
			});
			return hadError;
		}
		case "trigger":
			await resolveTrigger({ context, generation });
			return false;
		case "query":
			await executeQuery({ context, generation });
			return false;
		default: {
			const _exhaustiveCheck: never = node.content;
			throw new Error(`Unhandled step type: ${_exhaustiveCheck}`);
		}
	}
}

async function runSequence(args: {
	sequence: Sequence;
	context: GiselleEngineContext;
	flowRunId: FlowRunId;
	runId: RunId;
	workspaceId: WorkspaceId;
	triggerInputs?: GenerationContextInput[];
	callbacks?: RunFlowCallbacks;
	useExperimentalStorage: boolean;
}): Promise<boolean> {
	const {
		sequence,
		context,
		flowRunId,
		runId,
		workspaceId,
		triggerInputs,
		callbacks,
		useExperimentalStorage,
	} = args;

	await callbacks?.sequenceStart?.({ sequence });
	await patchRun({
		context,
		flowRunId,
		delta: {
			"steps.inProgress": { increment: 1 },
			"steps.queued": { decrement: 1 },
		},
	});

	let hasSequenceError = false;

	const stepDurations = await Promise.all(
		sequence.steps.map(async (step) => {
			const generation = createQueuedGeneration({
				step,
				runId,
				workspaceId,
				triggerInputs,
			});

			const stepStart = Date.now();
			const errored = await executeStep({
				context,
				generation,
				node: step.node,
				flowRunId,
				useExperimentalStorage,
			});
			const duration = Date.now() - stepStart;

			if (errored) {
				hasSequenceError = true;
			}

			return duration;
		}),
	);

	const totalTaskDuration = stepDurations.reduce((sum, d) => sum + d, 0);

	if (hasSequenceError) {
		await Promise.all([
			callbacks?.sequenceFail?.({ sequence }),
			patchRun({
				context,
				flowRunId,
				delta: {
					"steps.inProgress": { decrement: 1 },
					"steps.failed": { increment: 1 },
					"duration.totalTask": { increment: totalTaskDuration },
				},
			}),
		]);
	} else {
		await Promise.all([
			callbacks?.sequenceComplete?.({ sequence }),
			patchRun({
				context,
				flowRunId,
				delta: {
					"steps.inProgress": { decrement: 1 },
					"steps.completed": { increment: 1 },
					"duration.totalTask": { increment: totalTaskDuration },
				},
			}),
		]);
	}

	return hasSequenceError;
}

export async function runFlow(args: {
	flow: Workflow;
	context: GiselleEngineContext;
	flowRunId: FlowRunId;
	runId: RunId;
	workspaceId: WorkspaceId;
	triggerInputs?: GenerationContextInput[];
	callbacks?: RunFlowCallbacks;
	useExperimentalStorage: boolean;
}) {
	const flowStart = Date.now();

	for (let i = 0; i < args.flow.sequences.length; i++) {
		const sequence = args.flow.sequences[i];
		const errored = await runSequence({
			sequence,
			context: args.context,
			flowRunId: args.flowRunId,
			runId: args.runId,
			workspaceId: args.workspaceId,
			triggerInputs: args.triggerInputs,
			callbacks: args.callbacks,
			useExperimentalStorage: args.useExperimentalStorage,
		});

		if (errored) {
			// Skip remaining sequences
			for (let j = i + 1; j < args.flow.sequences.length; j++) {
				await args.callbacks?.sequenceSkip?.({
					sequence: args.flow.sequences[j],
				});
			}

			await patchRun({
				context: args.context,
				flowRunId: args.flowRunId,
				delta: {
					status: { set: "failed" },
					"duration.wallClock": { set: Date.now() - flowStart },
				},
			});
			return;
		}
	}

	// All sequences completed successfully
	await patchRun({
		context: args.context,
		flowRunId: args.flowRunId,
		delta: {
			status: { set: "completed" },
			"duration.wallClock": { set: Date.now() - flowStart },
		},
	});
}
