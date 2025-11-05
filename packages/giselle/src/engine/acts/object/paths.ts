import type { WorkspaceId } from "@giselles-ai/protocol";
import type { ActId } from "../../../concepts/identifiers";

export function actPath(actId: ActId) {
	return `acts/${actId}/act.json`;
}

export function workspaceActPath(workspaceId: WorkspaceId) {
	return `acts/byWorkspace/${workspaceId}.json`;
}
