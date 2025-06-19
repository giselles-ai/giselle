import {
	type FailedGeneration,
	type FlowTriggerId,
	type GenerationContextInput,
	GenerationId,
	type Job,
	type QueuedGeneration,
	RunId,
	type Workflow,
} from "@giselle-sdk/data-type";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import { AISDKError } from "ai";
import { generateImage, generateText, setGeneration } from "../generations";
import { executeAction } from "../operations";
import { executeQuery } from "../operations/execute-query";
import type { GiselleEngineContext } from "../types";
import { getWorkspace } from "../workspaces/utils";
import { createRun } from "./create-run";
import { patchRun } from "./patch-run";
import { resolveTrigger } from "./resolve-trigger";
import { FlowRunIndexObject } from "./run/object";
import { flowRunPath, workspaceFlowRunPath } from "./run/paths";
import { getFlowTrigger } from "./utils";

/** @todo telemetry */
export async function runFlow(args: {
	triggerId: FlowTriggerId;
	context: GiselleEngineContext;
	triggerInputs?: GenerationContextInput[];
	callbacks?: {
		flowCreate?: (args: { flow: Workflow }) => void | Promise<void>;
		jobStart?: (args: { job: Job }) => void | Promise<void>;
		jobFail?: (args: { job: Job }) => void | Promise<void>;
		jobComplete?: (args: { job: Job }) => void | Promise<void>;
		jobSkip?: (args: { job: Job }) => void | Promise<void>;
	};
}) {
	const trigger = await getFlowTrigger({
		storage: args.context.storage,
		flowTriggerId: args.triggerId,
	});
	if (trigger === undefined || !trigger.enable) {
		return;
	}
	const workspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: trigger.workspaceId,
	});

	const flow = buildWorkflowFromNode(
		trigger.nodeId,
		workspace.nodes,
		workspace.connections,
	);
	if (flow === null) {
		return;
	}

	await args.callbacks?.flowCreate?.({ flow });

	const runId = RunId.generate();
	const flowRun = await createRun({
		context: args.context,
		trigger: trigger.configuration.provider,
		workspaceId: trigger.workspaceId,
		jobsCount: flow.jobs.length,
	});
	await Promise.all([
		args.context.storage.setItem(flowRunPath(flowRun.id), flowRun),
		args.context.storage.setItem(
			workspaceFlowRunPath(trigger.workspaceId),
			FlowRunIndexObject.parse(flowRun),
		),
	]);

	const flowStartedAt = Date.now();
	let hasFlowError = false;
	for (const job of flow.jobs) {
		if (hasFlowError) {
			await args.callbacks?.jobSkip?.({ job });
			continue;
		}
		if (args.callbacks?.jobStart) {
			await args.callbacks.jobStart({ job });
		}
		await patchRun({
			context: args.context,
			flowRunId: flowRun.id,
			delta: {
				"steps.inProgress": { increment: 1 },
				"steps.queued": { decrement: 1 },
			},
		});
		const jobStartedAt = Date.now();
		let totalTasks = 0;
		let hasJobError = false;
		await Promise.all(
			job.operations.map(async (operation) => {
				const generationId = GenerationId.generate();
				const operationNode = operation.node;
				const generation = {
					id: generationId,
					context: {
						operationNode: operation.node,
						connections: operation.connections,
						sourceNodes: operation.sourceNodes,
						origin: {
							type: "run",
							id: runId,
							workspaceId: trigger.workspaceId,
						},
						inputs:
							operationNode.content.type === "trigger"
								? (args.triggerInputs ?? [])
								: [],
					},
					status: "queued",
					createdAt: Date.now(),
					queuedAt: Date.now(),
				} satisfies QueuedGeneration;
				switch (operationNode.content.type) {
					case "action":
						await executeAction({
							context: args.context,
							generation,
						});
						break;
					case "imageGeneration":
						await generateImage({
							context: args.context,
							generation,
						});
						break;
					case "textGeneration": {
						const generateTextResult = await generateText({
							context: args.context,
							generation,
						});
						await generateTextResult.consumeStream({
							onError: async (error) => {
								hasJobError = true;
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
											context: args.context,
											generation: failedGeneration,
										}),
										patchRun({
											context: args.context,
											flowRunId: flowRun.id,
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
						break;
					}
					case "trigger":
						await resolveTrigger({
							context: args.context,
							generation,
						});
						break;
					case "query":
						await executeQuery({
							context: args.context,
							generation,
						});
						break;
					default: {
						const _exhaustiveCheck: never = operationNode.content;
						throw new Error(`Unhandled operation type: ${_exhaustiveCheck}`);
					}
				}
				totalTasks += Date.now() - jobStartedAt;
			}),
		);
		if (hasJobError) {
			hasFlowError = true;
			await Promise.all([
				args.callbacks?.jobFail?.({ job }),
				patchRun({
					context: args.context,
					flowRunId: flowRun.id,
					delta: {
						"steps.inProgress": { decrement: 1 },
						"steps.failed": { increment: 1 },
						"duration.totalTask": { increment: totalTasks },
					},
				}),
			]);
		} else {
			await Promise.all([
				args.callbacks?.jobComplete?.({ job }),
				patchRun({
					context: args.context,
					flowRunId: flowRun.id,
					delta: {
						"steps.inProgress": { decrement: 1 },
						"steps.completed": { increment: 1 },
						"duration.totalTask": { increment: totalTasks },
					},
				}),
			]);
		}
	}
	if (hasFlowError) {
		await patchRun({
			context: args.context,
			flowRunId: flowRun.id,
			delta: {
				status: { set: "failed" },
				"duration.wallClock": { set: Date.now() - flowStartedAt },
			},
		});
	} else {
		await patchRun({
			context: args.context,
			flowRunId: flowRun.id,
			delta: {
				status: { set: "completed" },
				"duration.wallClock": { set: Date.now() - flowStartedAt },
			},
		});
	}
}
