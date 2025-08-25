import type { WorkspaceId } from "@giselle-sdk/data-type";
import { db } from "@/drizzle";

export async function getWorkspaceTeam(workspaceId: WorkspaceId) {
	// First, get the workspace and its team
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
		with: {
			team: true,
		},
	});

	if (!agent) {
		throw new Error(`Workspace ${workspaceId} not found`);
	}

	// Then, check for active subscription
	const activeSubscription = await db.query.subscriptions.findFirst({
		where: (subscriptions, { eq, and }) =>
			and(
				eq(subscriptions.teamDbId, agent.team.dbId),
				eq(subscriptions.status, "active"),
			),
	});

	return {
		...agent.team,
		activeSubscriptionId: activeSubscription?.id || null,
		subscription: activeSubscription || null,
	};
}
