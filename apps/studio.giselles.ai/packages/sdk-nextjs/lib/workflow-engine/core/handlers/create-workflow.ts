import { createIdGenerator } from "@/lib/utils/generate-id";
import {
	WorkflowDataJson,
	generateInitialWorkflowData,
	workflowId,
} from "@/lib/workflow-data";
import { z } from "zod";
import { setGraphToStorage } from "../helpers/set-graph-to-storage";
import type { WorkflowEngineHandlerArgs } from "./types";

export const Output = z.object({
	workflowData: WorkflowDataJson,
});

export async function createWorkflow({ context }: WorkflowEngineHandlerArgs) {
	const workflowData = generateInitialWorkflowData();
	await setGraphToStorage({
		storage: context.storage,
		workflowId: workflowData.id,
		workflowData: WorkflowDataJson.parse(workflowData),
	});
	return Output.parse({ workflowData });
}
