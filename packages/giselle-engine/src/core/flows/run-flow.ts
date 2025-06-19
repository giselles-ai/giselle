import {
	type FailedGeneration,
	type FlowTriggerId,
	type GenerationContextInput,
	GenerationId,
	type Job,
	type QueuedGeneration,
	RunId,
	type Workflow,
	type WorkspaceId,
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
import { type FlowRunId, FlowRunIndexObject } from "./run/object";
import { flowRunPath, workspaceFlowRunPath } from "./run/paths";
import { getFlowTrigger } from "./utils";

type Callbacks = {
	flowCreate?: (args: { flow: Workflow }) => void | Promise<void>;
	jobStart?: (args: { job: Job }) => void | Promise<void>;
	jobFail?: (args: { job: Job }) => void | Promise<void>;
	jobComplete?: (args: { job: Job }) => void | Promise<void>;
	jobSkip?: (args: { job: Job }) => void | Promise<void>;
};

function createQueuedGeneration(args: {
	operation: Job["operations"][number];
	runId: RunId;
	workspaceId: WorkspaceId;
	triggerInputs?: GenerationContextInput[];
}) {
	const { operation, runId, workspaceId, triggerInputs } = args;
	return {
		id: GenerationId.generate(),
		context: {
			operationNode: operation.node,
			connections: operation.connections,
			sourceNodes: operation.sourceNodes,
			origin: { type: "run", id: runId, workspaceId },
			inputs:
				operation.node.content.type === "trigger" ? (triggerInputs ?? []) : [],
		},
		status: "queued",
		createdAt: Date.now(),
		queuedAt: Date.now(),
	} satisfies QueuedGeneration;
}

async function executeOperation(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	node: Job["operations"][number]["node"];
	flowRunId: FlowRunId;
}): Promise<boolean> {
	const { context, generation, node, flowRunId } = args;
	switch (node.content.type) {
		case "action":
			await executeAction({ context, generation });
			return false;
		case "imageGeneration":
			await generateImage({ context, generation });
			return false;
		case "textGeneration": {
			let hadError = false;
			const result = await generateText({ context, generation });
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
			throw new Error(`Unhandled operation type: ${_exhaustiveCheck}`);
		}
	}
}

async function runJob(args: {
	job: Job;
	context: GiselleEngineContext;
	flowRunId: FlowRunId;
	runId: RunId;
	workspaceId: WorkspaceId;
	triggerInputs?: GenerationContextInput[];
	callbacks?: Callbacks;
}): Promise<boolean> {
	const {
		job,
		context,
		flowRunId,
		runId,
		workspaceId,
		triggerInputs,
		callbacks,
	} = args;

	await callbacks?.jobStart?.({ job });
	await patchRun({
		context,
		flowRunId,
		delta: {
			"steps.inProgress": { increment: 1 },
			"steps.queued": { decrement: 1 },
		},
	});

	let hasJobError = false;

	const operationDurations = await Promise.all(
		job.operations.map(async (operation) => {
			const generation = createQueuedGeneration({
				operation,
				runId,
				workspaceId,
				triggerInputs,
			});

			const operationStart = Date.now();
			const errored = await executeOperation({
				context,
				generation,
				node: operation.node,
				flowRunId,
			});
			const duration = Date.now() - operationStart;

			if (errored) {
				hasJobError = true;
			}

			return duration;
		}),
	);

	const totalTaskDuration = operationDurations.reduce((sum, d) => sum + d, 0);

	if (hasJobError) {
		await Promise.all([
			callbacks?.jobFail?.({ job }),
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
			callbacks?.jobComplete?.({ job }),
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

	return hasJobError;
}

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

	const triggerNode = workspace.nodes.find(
		(node) => node.id === trigger.nodeId,
	);
	if (triggerNode === undefined) {
		return;
	}

	const flow = buildWorkflowFromNode(triggerNode, workspace);
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

	const flowStart = Date.now();

	for (let i = 0; i < flow.jobs.length; i++) {
		const job = flow.jobs[i];
		const errored = await runJob({
			job,
			context: args.context,
			flowRunId: flowRun.id,
			runId,
			workspaceId: trigger.workspaceId,
			triggerInputs: args.triggerInputs,
			callbacks: args.callbacks,
		});

		if (errored) {
			// Skip remaining jobs
			for (let j = i + 1; j < flow.jobs.length; j++) {
				await args.callbacks?.jobSkip?.({ job: flow.jobs[j] });
			}

			await patchRun({
				context: args.context,
				flowRunId: flowRun.id,
				delta: {
					status: { set: "failed" },
					"duration.wallClock": { set: Date.now() - flowStart },
				},
			});
			return;
		}
	}

	// All jobs completed successfully
	await patchRun({
		context: args.context,
		flowRunId: flowRun.id,
		delta: {
			status: { set: "completed" },
			"duration.wallClock": { set: Date.now() - flowStart },
		},
	});
}
