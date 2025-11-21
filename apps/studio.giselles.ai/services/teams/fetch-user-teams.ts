import { asc, eq } from "drizzle-orm";
import { db, supabaseUserMappings, teamMemberships, teams } from "@/db";
import { getUser } from "@/lib/supabase";

/**
 * fetch teams for the current user
 */
export async function fetchUserTeams() {
	const user = await getUser();

	const records = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			avatarUrl: teams.avatarUrl,
			plan: teams.plan,
			activeSubscriptionId: teams.activeSubscriptionId,
			activeCustomerId: teams.activeCustomerId,
			role: teamMemberships.role,
		})
		.from(teams)
		.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
		.innerJoin(
			supabaseUserMappings,
			eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
		)
		.where(eq(supabaseUserMappings.supabaseUserId, user.id))
		.orderBy(asc(teams.dbId));
	if (records.length === 0) {
		throw new Error("User does not have a team");
	}
	return records;
}
