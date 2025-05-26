import { agents, db } from "@/drizzle";
import type { WorkspaceId } from "@giselle-sdk/data-type";
import { and, eq } from "drizzle-orm";

/**
 * Retrieves the agent associated with the specified workspace.
 * @param workspaceId - The workspace ID to find the associated agent
 * @returns The agent information
 * @throws Error if no agent is found
 */
export async function fetchAgentFromWorkspaceId(workspaceId: WorkspaceId) {
	const result = await db
		.select()
		.from(agents)
		.where(and(eq(agents.workspaceId, workspaceId)));

	if (result.length === 0) {
		throw new Error(`No agent found for workspace: ${workspaceId}`);
	}

	return result[0];
}
