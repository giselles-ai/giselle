import type { WorkflowData, WorkflowId } from "../workflow-data";
import { Output } from "../workflow-engine/core/handlers/save-workflow";

export async function callSaveWorkflowApi({
	api = "/api/workflow/save-workflow",
	workflowId,
	workflowData,
}: {
	api?: string;
	workflowId: WorkflowId;
	workflowData: WorkflowData;
}) {
	const response = await fetch(api, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			workflowId,
			workflowData: {
				...workflowData,
				nodes: Object.fromEntries(workflowData.nodes),
				connections: Object.fromEntries(workflowData.connections),
			},
		}),
	});
	const data = await response.json();
	return Output.parse(data);
}
