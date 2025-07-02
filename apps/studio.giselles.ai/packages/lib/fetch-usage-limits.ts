import type { WorkspaceId } from "@giselle-sdk/data-type";
import { and, eq } from "drizzle-orm";
import { agents, db, subscriptions, teams } from "@/drizzle";
import { getUsageLimitsForTeam } from "./usage-limits";

export async function fetchUsageLimits(workspaceId: WorkspaceId) {
	const records = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			type: teams.type,
			activeSubscriptionId: subscriptions.id,
		})
		.from(teams)
		.innerJoin(agents, eq(agents.workspaceId, workspaceId))
		.leftJoin(
			subscriptions,
			and(
				eq(subscriptions.teamDbId, teams.dbId),
				eq(subscriptions.status, "active"),
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
