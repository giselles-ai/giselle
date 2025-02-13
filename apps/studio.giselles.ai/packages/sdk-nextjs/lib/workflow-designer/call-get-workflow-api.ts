import { WorkflowData, type WorkflowId } from "../workflow-data";
import { Output } from "../workflow-engine/core/handlers/get-workflow";

export async function callGetWorkflowApi({
	host = process.env.NEXT_PUBLIC_VERCEL_URL ?? "localhost:3000",
	api = "/api/workflow/get-workflow",
	workflowId,
}: {
	api?: string;
	host?: string;
	workflowId: WorkflowId;
}) {
	const response = await fetch(`http://${host}${api}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ workflowId }),
	});
	const json = await response.json();
	const output = Output.parse(json);
	return WorkflowData.parse(output.workflowData);
}
