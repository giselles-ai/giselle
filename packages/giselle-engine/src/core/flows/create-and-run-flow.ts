import {
	type FlowTriggerId,
	type GenerationContextInput,
	RunId,
	type Workflow,
} from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { buildWorkflowFromTrigger } from "./build-workflow-from-trigger";
import { createRun } from "./create-run";
import { FlowRunIndexObject } from "./run/object";
import { flowRunPath, workspaceFlowRunPath } from "./run/paths";
import { type RunFlowCallbacks, runFlow } from "./run-flow";

/** @todo telemetry */
export async function createAndRunFlow(args: {
	triggerId: FlowTriggerId;
	context: GiselleEngineContext;
	triggerInputs?: GenerationContextInput[];
	callbacks?: {
		flowCreate?: (args: { flow: Workflow }) => void | Promise<void>;
	} & RunFlowCallbacks;
	useExperimentalStorage: boolean;
}) {
	const result = await buildWorkflowFromTrigger({
		triggerId: args.triggerId,
		context: args.context,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	if (result === null) {
		return;
	}

	const { workflow, trigger } = result;

	await args.callbacks?.flowCreate?.({ flow: workflow });

	const runId = RunId.generate();
	const flowRun = await createRun({
		context: args.context,
		trigger: trigger.configuration.provider,
		workspaceId: trigger.workspaceId,
		jobsCount: workflow.sequences.length,
	});
	await Promise.all([
		args.context.storage.setItem(flowRunPath(flowRun.id), flowRun),
		args.context.storage.setItem(
			workspaceFlowRunPath(trigger.workspaceId),
			FlowRunIndexObject.parse(flowRun),
		),
	]);

	await runFlow({
		flow: workflow,
		context: args.context,
		flowRunId: flowRun.id,
		runId,
		workspaceId: trigger.workspaceId,
		triggerInputs: args.triggerInputs,
		callbacks: args.callbacks,
		useExperimentalStorage: args.useExperimentalStorage,
	});
}
