import type { WorkspaceId } from "@giselle-sdk/data-type";
import { and, eq } from "drizzle-orm";
import { agents, db, activeSubscriptions, teams } from "@/db";
import { getUsageLimitsForTeam } from "./usage-limits";

export async function fetchUsageLimits(workspaceId: WorkspaceId) {
	const records = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			type: teams.type,
			activeSubscriptionId: activeSubscriptions.id,
		})
		.from(teams)
		.innerJoin(agents, eq(agents.workspaceId, workspaceId))
		.leftJoin(
			activeSubscriptions,
			and(
				eq(activeSubscriptions.teamDbId, teams.dbId),
				eq(activeSubscriptions.status, "active"),
			),
		)
		.where(eq(teams.dbId, agents.teamDbId))
		.limit(1);

	if (records.length === 0) {
		throw new Error("Team not found");
	}

	const currentTeam = records[0];
	return await getUsageLimitsForTeam(currentTeam);
}
