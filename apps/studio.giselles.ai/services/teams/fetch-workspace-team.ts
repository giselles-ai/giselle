import { and, eq } from "drizzle-orm";
import { db, subscriptions, teams } from "@/db";
import type { CurrentTeam } from "@/services/teams";

/**
 * Fetch the team that owns the workspace by its database ID
 */
export async function fetchWorkspaceTeam(
	workspaceTeamDbId: number,
): Promise<CurrentTeam | null> {
	const teamResult = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			avatarUrl: teams.avatarUrl,
			plan: teams.plan,
			activeSubscriptionId: subscriptions.id,
		})
		.from(teams)
		.leftJoin(
			subscriptions,
			and(
				eq(subscriptions.teamDbId, teams.dbId),
				eq(subscriptions.status, "active"),
			),
		)
		.where(eq(teams.dbId, workspaceTeamDbId))
		.limit(1);

	if (teamResult.length === 0) {
		return null;
	}

	return teamResult[0];
}
