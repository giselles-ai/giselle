import { and, eq } from "drizzle-orm";
import { db, teamMemberships } from "@/db";

/**
 * Checks if the specified user is a member of the specified team
 */
export async function isMemberOfTeam(
	userDbId: number,
	teamDbId: number,
): Promise<boolean> {
	const membership = await db
		.select({ teamDbId: teamMemberships.teamDbId })
		.from(teamMemberships)
		.where(
			and(
				eq(teamMemberships.userDbId, userDbId),
				eq(teamMemberships.teamDbId, teamDbId),
			),
		)
		.limit(1);

	return membership.length > 0;
}
