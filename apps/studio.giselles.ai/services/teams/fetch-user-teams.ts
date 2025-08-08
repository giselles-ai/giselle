import { and, asc, eq } from "drizzle-orm";
import {
	db,
	subscriptions,
	supabaseUserMappings,
	teamMemberships,
	teams,
} from "@/drizzle";
import { getUser } from "@/lib/supabase";

/**
 * fetch teams for the current user
 */
export async function fetchUserTeams() {
	const user = await getUser();

	// Try with profileImageUrl first, fallback if column doesn't exist
	try {
		const records = await db
			.select({
				id: teams.id,
				dbId: teams.dbId,
				name: teams.name,
				profileImageUrl: teams.profileImageUrl,
				type: teams.type,
				activeSubscriptionId: subscriptions.id,
				role: teamMemberships.role,
			})
			.from(teams)
			.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
			.innerJoin(
				supabaseUserMappings,
				eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
			)
			.leftJoin(
				subscriptions,
				and(
					eq(subscriptions.teamDbId, teams.dbId),
					eq(subscriptions.status, "active"),
				),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, user.id))
			.orderBy(asc(teams.dbId));
		if (records.length === 0) {
			throw new Error("User does not have a team");
		}
		return records;
	} catch (_error) {
		// Fallback without profileImageUrl if column doesn't exist
		const records = await db
			.select({
				id: teams.id,
				dbId: teams.dbId,
				name: teams.name,
				type: teams.type,
				activeSubscriptionId: subscriptions.id,
				role: teamMemberships.role,
			})
			.from(teams)
			.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
			.innerJoin(
				supabaseUserMappings,
				eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
			)
			.leftJoin(
				subscriptions,
				and(
					eq(subscriptions.teamDbId, teams.dbId),
					eq(subscriptions.status, "active"),
				),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, user.id))
			.orderBy(asc(teams.dbId));
		if (records.length === 0) {
			throw new Error("User does not have a team");
		}
		return records.map((record) => ({
			...record,
			profileImageUrl: null as string | null,
		}));
	}
}
