import type { WorkspaceId } from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import { agents, db, teams } from "@/db";
import { getUsageLimitsForTeam } from "./usage-limits";

export async function fetchUsageLimits(workspaceId: WorkspaceId) {
	const records = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			plan: teams.plan,
			activeSubscriptionId: teams.activeSubscriptionId,
			activeCustomerId: teams.activeCustomerId,
		})
		.from(teams)
		.innerJoin(agents, eq(agents.workspaceId, workspaceId))
		.where(eq(teams.dbId, agents.teamDbId))
		.limit(1);

	if (records.length === 0) {
		throw new Error("Team not found");
	}

	const currentTeam = records[0];
	return await getUsageLimitsForTeam(currentTeam);
}
