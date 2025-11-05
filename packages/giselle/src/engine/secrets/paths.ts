import type { SecretId, WorkspaceId } from "@giselles-ai/protocol";

export function secretPath(secretId: SecretId) {
	return `secrets/${secretId}/secret.json`;
}

export function workspaceSecretIndexPath(workspaceId: WorkspaceId) {
	return `secrets/byWorkspace/${workspaceId}.json`;
}
