"use server";

import type { WorkspaceId } from "@giselles-ai/protocol";
import { eq } from "drizzle-orm/sql";
import { giselleEngine } from "@/app/giselle-engine";
import { agents, db, workspaces } from "@/db";

export async function updateWorkspaceName(
	workspaceId: WorkspaceId,
	name: string,
) {
	const workspace = await giselleEngine.getWorkspace(workspaceId);

	const previousWorkspace = structuredClone(workspace);
	const updatedWorkspace = { ...workspace, name };

	await giselleEngine.updateWorkspace(updatedWorkspace);

	try {
		await db
			.update(agents)
			.set({ name })
			.where(eq(agents.workspaceId, workspaceId));
		await db
			.update(workspaces)
			.set({ name })
			.where(eq(workspaces.id, workspaceId));
	} catch (error) {
		try {
			await giselleEngine.updateWorkspace(previousWorkspace);
		} catch (rollbackError) {
			console.error(
				"Failed to rollback workspace name after agents update failure",
				rollbackError,
			);
		}
		throw error;
	}
}
