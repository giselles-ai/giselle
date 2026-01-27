"use server";

import type { SecretId, WorkspaceId } from "@giselles-ai/protocol";
import { Secret } from "@giselles-ai/protocol";
import { giselle, storage } from "@/app/giselle";
import { getCurrentUser } from "@/lib/get-current-user";
import { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";
import { isMemberOfTeam } from "@/services/teams";

function secretPath(secretId: SecretId) {
	return `secrets/${secretId}/secret.json`;
}

async function assertWorkspaceAccess(workspaceId: WorkspaceId) {
	const [currentUser, workspaceTeam] = await Promise.all([
		getCurrentUser(),
		getWorkspaceTeam(workspaceId),
	]);
	const isMember = await isMemberOfTeam(currentUser.dbId, workspaceTeam.dbId);
	if (!isMember) {
		throw new Error("Not authorized to access this workspace");
	}
}

async function getSecret(secretId: SecretId) {
	return await storage.getJson({
		path: secretPath(secretId),
		schema: Secret,
	});
}

export async function addSecret(
	input: Parameters<typeof giselle.addSecret>[0],
) {
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
