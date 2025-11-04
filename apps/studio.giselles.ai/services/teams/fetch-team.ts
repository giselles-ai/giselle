import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activeSubscriptions, teams } from "@/db/schema";
import type { TeamWithSubscription } from "./types";

export async function fetchTeamByDbId(
	dbId: number,
): Promise<TeamWithSubscription | null> {
	const result = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			avatarUrl: teams.avatarUrl,
			type: teams.type,
			activeSubscriptionId: activeSubscriptions.id,
		})
		.from(teams)
		.where(eq(teams.dbId, dbId))
		.leftJoin(
			activeSubscriptions,
			and(
				eq(activeSubscriptions.teamDbId, teams.dbId),
				eq(activeSubscriptions.status, "active"),
			),
		);

	if (result.length === 0) {
		return null;
	}
	return result[0];
}
