import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { FlowRunId } from "./object";

export function flowRunPath(flowRunId: FlowRunId) {
	return `flow-runs/${flowRunId}/flow-run.json`;
}

export function workspaceFlowRunPath(workspaceId: WorkspaceId) {
	return `flow-runs/byWorkspace/${workspaceId}.json`;
}
