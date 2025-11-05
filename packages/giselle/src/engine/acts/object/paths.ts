import type { ActId, WorkspaceId } from "@giselles-ai/protocol";

export function actPath(actId: ActId) {
	return `acts/${actId}/act.json`;
}

export function workspaceActPath(workspaceId: WorkspaceId) {
	return `acts/byWorkspace/${workspaceId}.json`;
}
