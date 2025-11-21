import type { WorkspaceId } from "@giselles-ai/protocol";
import { db } from "@/db";

export async function getWorkspaceTeam(workspaceId: WorkspaceId) {
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
		with: {
			team: true,
		},
	});

	if (!agent) {
		throw new Error(`Workspace ${workspaceId} not found`);
	}

	return {
		...agent.team,
		activeSubscriptionId: agent.team.activeSubscriptionId,
	};
}
