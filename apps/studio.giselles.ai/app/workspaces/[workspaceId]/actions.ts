"use server";

import type { WorkspaceId } from "@giselle-sdk/data-type";
import { eq } from "drizzle-orm/sql";
import { giselleEngine } from "@/app/giselle-engine";
import { agents, db } from "@/drizzle";
import { experimental_storageFlag } from "@/flags";

export async function updateAgentName(workspaceId: WorkspaceId, name: string) {
	const useExperimentalStorage = await experimental_storageFlag();

	const workspace = await giselleEngine.getWorkspace(
		workspaceId,
		useExperimentalStorage,
	);

	await Promise.all([
		db.update(agents).set({ name }).where(eq(agents.workspaceId, workspaceId)),
		giselleEngine.updateWorkspace(
			{ ...workspace, name },
			useExperimentalStorage,
		),
	]);
}
