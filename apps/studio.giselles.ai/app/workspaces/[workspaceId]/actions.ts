"use server";

import type { WorkspaceId } from "@giselle-sdk/data-type";
import { eq } from "drizzle-orm/sql";
import { giselleEngine } from "@/app/giselle-engine";
import { agents, db } from "@/drizzle";
import { experimental_storageFlag } from "@/flags";

export async function updateAppName(workspaceId: WorkspaceId, name: string) {
	const useExperimentalStorage = await experimental_storageFlag();

	const workspace = await giselleEngine.getWorkspace(
		workspaceId,
		useExperimentalStorage,
	);

	const previousWorkspace = workspace;
	const updatedWorkspace = { ...workspace, name };

	await giselleEngine.updateWorkspace(updatedWorkspace, useExperimentalStorage);

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
