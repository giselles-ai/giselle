import { agents, db, subscriptions, teams } from "@/drizzle";
import type { WorkspaceId } from "@giselle-sdk/data-type";
import { eq } from "drizzle-orm";
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
		.leftJoin(subscriptions, eq(teams.dbId, subscriptions.teamDbId))
		.where(eq(teams.dbId, agents.teamDbId))
		.limit(1);

	if (records.length === 0) {
		throw new Error("Team not found");
	}

	const currentTeam = records[0];
	return await getUsageLimitsForTeam(currentTeam);
}
