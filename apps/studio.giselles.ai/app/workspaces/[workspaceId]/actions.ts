"use server";

import type { WorkspaceId } from "@giselle-sdk/data-type";
import { eq } from "drizzle-orm/sql";
import { giselleEngine } from "@/app/giselle-engine";
import { agents, db } from "@/drizzle";

export async function updateWorkspaceName(
	workspaceId: WorkspaceId,
	name: string,
) {
	const workspace = await giselleEngine.getWorkspace(
		workspaceId,
		useExperimentalStorage,
	);

	const previousWorkspace = workspace;
	const updatedWorkspace = { ...workspace, name };

	await giselleEngine.updateWorkspace(updatedWorkspace, true);

	try {
		await db
			.update(agents)
			.set({ name })
			.where(eq(agents.workspaceId, workspaceId));
	} catch (error) {
		try {
			await giselleEngine.updateWorkspace(
				previousWorkspace,
				useExperimentalStorage,
			);
		} catch (rollbackError) {
			console.error(
				"Failed to rollback workspace name after agents update failure",
				rollbackError,
			);
		}
		throw error;
	}
}
