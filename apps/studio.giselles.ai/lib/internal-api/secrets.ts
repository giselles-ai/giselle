"use server";

import type { SecretId, WorkspaceId } from "@giselles-ai/protocol";
import { Secret } from "@giselles-ai/protocol";
import { giselle, storage } from "@/app/giselle";
import { assertWorkspaceAccess } from "./utils";

function secretPath(secretId: SecretId) {
	return `secrets/${secretId}/secret.json`;
}

async function getSecret(secretId: SecretId) {
	return await storage.getJson({
		path: secretPath(secretId),
		schema: Secret,
	});
}

/**
 * giselle.addSecret allows optional workspaceId, but this API expects a workspace
 * to always exist for its use cases. If it's missing, we cannot verify ownership,
 * so we fail fast. This differs from giselle.addSecret's input type, but matches
 * the intended usage here.
 */
export async function addSecret(
	input: Parameters<typeof giselle.addSecret>[0],
) {
	if (input.workspaceId === undefined) {
		throw new Error("Workspace ID is required");
	}
	await assertWorkspaceAccess(input.workspaceId);
	return { secret: await giselle.addSecret(input) };
}

export async function deleteSecret(
	input: Parameters<typeof giselle.deleteSecret>[0],
) {
	const secret = await getSecret(input.secretId);
	if (!secret.workspaceId) {
		throw new Error("Secret is not associated with a workspace");
	}
	await assertWorkspaceAccess(secret.workspaceId);
	await giselle.deleteSecret(input);
}

export async function getWorkspaceSecrets(input: {
	workspaceId: WorkspaceId;
	tags?: string[];
}) {
	await assertWorkspaceAccess(input.workspaceId);
	return { secrets: await giselle.getWorkspaceSecrets(input) };
}
