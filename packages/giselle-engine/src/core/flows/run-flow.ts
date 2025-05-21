import {
	type FlowTriggerId,
	type GenerationContextInput,
	GenerationId,
	type QueuedGeneration,
	RunId,
} from "@giselle-sdk/data-type";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import { generateImage, generateText } from "../generations";
import { executeAction } from "../operations";
import { executeQuery } from "../operations/execute-query";
import type { GiselleEngineContext } from "../types";
import { getWorkspace } from "../workspaces/utils";
import { resolveTrigger } from "./resolve-trigger";
import { getFlowTrigger } from "./utils";

/** @todo telemetry */
export async function runFlow(args: {
	triggerId: FlowTriggerId;
	context: GiselleEngineContext;
	triggerInputs?: GenerationContextInput[];
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

	const runId = RunId.generate();
	for (const job of flow.jobs) {
		await Promise.all(
			job.operations.map(async (operation) => {
				const generationId = GenerationId.generate();
				const operationNode = operation.generationTemplate.operationNode;
				const generation = {
					id: generationId,
					context: {
						...operation.generationTemplate,
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
						await generateTextResult.consumeStream();
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
			}),
		);
	}
}
