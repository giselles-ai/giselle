import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import {
	db,
	subscriptions,
	supabaseUserMappings,
	teamMemberships,
	teams,
} from "@/drizzle";
import { getGiselleSession } from "@/lib/giselle-session";
import { getUser } from "@/lib/supabase";
import type { CurrentTeam, TeamId } from "./types";

/**
 * Fetches the current team of the user.
 * This function uses session to get the teamId.
 * If the user does not have a team, the first team is returned.
 */
async function fetchCurrentTeam(): Promise<CurrentTeam> {
	const supabaseUser = await getUser();
	const session = await getGiselleSession();
	const teamId = session?.teamId;

	if (teamId == null) {
		return fetchFirstTeam(supabaseUser.id);
	}

	const team = await fetchTeam(teamId, supabaseUser.id);
	if (team == null) {
		// fallback to first team
		return fetchFirstTeam(supabaseUser.id);
	}
	return team;
}

const cachedFetchCurrentTeam = cache(fetchCurrentTeam);
export { cachedFetchCurrentTeam as fetchCurrentTeam };

async function fetchTeam(teamId: TeamId, supabaseUserId: string) {
	const result = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			type: teams.type,
			activeSubscriptionId: subscriptions.id,
		})
		.from(teams)
		// join teamMemberships and supabaseUserMappings to check user's membership
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
		.where(
			and(
				eq(supabaseUserMappings.supabaseUserId, supabaseUserId),
				eq(teams.id, teamId),
			),
		);
	if (result.length === 0) {
		return null;
	}
	return result[0];
}

async function fetchFirstTeam(supabaseUserId: string) {
	const team = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			type: teams.type,
			activeSubscriptionId: subscriptions.id,
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
		.where(eq(supabaseUserMappings.supabaseUserId, supabaseUserId))
		.orderBy(asc(teams.dbId))
		.limit(1);

	if (team.length === 0) {
		throw new Error("User does not have a team");
	}
	return team[0];
}
