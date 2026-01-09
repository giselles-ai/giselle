"use server";

import type { WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export async function getWorkspace(input: { workspaceId: WorkspaceId }) {
	return await giselle.getWorkspace(input.workspaceId);
}

export async function updateWorkspace(input: {
	workspace: Parameters<typeof giselle.updateWorkspace>[0];
}) {
	return await giselle.updateWorkspace(input.workspace);
}
