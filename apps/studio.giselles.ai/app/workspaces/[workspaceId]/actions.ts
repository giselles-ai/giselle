"use server";

import type { WorkspaceId } from "@giselle-sdk/data-type";
import { eq } from "drizzle-orm/sql";
import { agents, db } from "@/drizzle";

export async function updateAgentName(workspaceId: WorkspaceId, name: string) {
	await db
		.update(agents)
		.set({ name })
		.where(eq(agents.workspaceId, workspaceId));
}
