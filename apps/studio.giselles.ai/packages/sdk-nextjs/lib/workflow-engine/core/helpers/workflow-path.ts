import type { WorkflowId } from "@/lib/workflow-data";

export function workflowDataPath(workflowId: WorkflowId) {
	return `${workflowId}/workflow-data.json`;
}
