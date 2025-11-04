import type { SecretId, WorkspaceId } from "@giselle-ai/data-type";

export function secretPath(secretId: SecretId) {
	return `secrets/${secretId}/secret.json`;
}

export function workspaceSecretIndexPath(workspaceId: WorkspaceId) {
	return `secrets/byWorkspace/${workspaceId}.json`;
}
