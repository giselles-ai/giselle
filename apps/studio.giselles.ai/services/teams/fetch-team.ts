import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, teams } from "@/db/schema";
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
			plan: teams.plan,
			activeSubscriptionId: subscriptions.id,
		})
		.from(teams)
		.where(eq(teams.dbId, dbId))
		.leftJoin(
			subscriptions,
			and(
				eq(subscriptions.teamDbId, teams.dbId),
				eq(subscriptions.status, "active"),
			),
		);

	if (result.length === 0) {
		return null;
	}
	return result[0];
}
