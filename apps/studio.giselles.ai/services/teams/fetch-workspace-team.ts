import { and, eq } from "drizzle-orm";
import { db, activeSubscriptions, teams } from "@/db";
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
			type: teams.type,
			activeSubscriptionId: activeSubscriptions.id,
		})
		.from(teams)
		.leftJoin(
			activeSubscriptions,
			and(
				eq(activeSubscriptions.teamDbId, teams.dbId),
				eq(activeSubscriptions.status, "active"),
			),
		)
		.where(eq(teams.dbId, workspaceTeamDbId))
		.limit(1);

	if (teamResult.length === 0) {
		return null;
	}

	return teamResult[0];
}
