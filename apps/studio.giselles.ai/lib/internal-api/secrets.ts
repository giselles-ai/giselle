"use server";

import type { WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export async function addSecret(
	input: Parameters<typeof giselle.addSecret>[0],
) {
	return { secret: await giselle.addSecret(input) };
}

export async function deleteSecret(
	input: Parameters<typeof giselle.deleteSecret>[0],
) {
	await giselle.deleteSecret(input);
}

export async function getWorkspaceSecrets(input: {
	workspaceId: WorkspaceId;
	tags?: string[];
}) {
	return { secrets: await giselle.getWorkspaceSecrets(input) };
}
