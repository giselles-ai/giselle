"use server";

import type { WorkspaceId } from "@giselles-ai/protocol";
import { eq } from "drizzle-orm/sql";
import { revalidatePath } from "next/cache";
import { giselle } from "@/app/giselle";
import { agents, db, workspaces } from "@/db";

export async function updateWorkspaceName(
	workspaceId: WorkspaceId,
	name: string,
) {
	const workspace = await giselle.getWorkspace(workspaceId);

	const previousWorkspace = structuredClone(workspace);
	const updatedWorkspace = { ...workspace, name };

	await giselle.updateWorkspace(updatedWorkspace);
	revalidatePath(`/workspaces/${workspace.id}`, "layout");

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
			await giselle.updateWorkspace(previousWorkspace);
		} catch (rollbackError) {
			console.error(
				"Failed to rollback workspace name after agents update failure",
				rollbackError,
			);
		}
		throw error;
	}
}
