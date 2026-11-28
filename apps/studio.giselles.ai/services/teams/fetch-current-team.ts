import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { db, teamMemberships, teams } from "@/db";
import { getCurrentUser } from "@/lib/get-current-user";
import { getGiselleSession } from "@/lib/giselle-session";
import { isLocalStudio } from "@/lib/local-studio";
import type { CurrentTeam, TeamId } from "./types";

/**
 * Fetches the current team of the user.
 * This function uses session to get the teamId.
 * If the user does not have a team, the first team is returned.
 */
async function fetchCurrentTeam(): Promise<CurrentTeam> {
	const user = await getCurrentUser();
	if (isLocalStudio) {
		const team = await fetchTeam("tm_local", user.dbId);
		if (!team) throw new Error("Local team has not been initialized");
		return team;
	}
	const session = await getGiselleSession();
	const teamId = session?.teamId;

	if (teamId == null) {
		return fetchFirstTeam(user.dbId);
	}

	const team = await fetchTeam(teamId, user.dbId);
	if (team == null) {
		// fallback to first team
		return fetchFirstTeam(user.dbId);
	}
	return team;
}

const cachedFetchCurrentTeam = cache(fetchCurrentTeam);
export { cachedFetchCurrentTeam as fetchCurrentTeam };

async function fetchTeam(teamId: TeamId, userDbId: number) {
	const result = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			avatarUrl: teams.avatarUrl,
			plan: teams.plan,
			activeSubscriptionId: teams.activeSubscriptionId,
			activeCustomerId: teams.activeCustomerId,
		})
		.from(teams)
		.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
		.where(and(eq(teamMemberships.userDbId, userDbId), eq(teams.id, teamId)));
	if (result.length === 0) {
		return null;
	}
	return result[0];
}

async function fetchFirstTeam(userDbId: number) {
	const team = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			avatarUrl: teams.avatarUrl,
			plan: teams.plan,
			activeSubscriptionId: teams.activeSubscriptionId,
			activeCustomerId: teams.activeCustomerId,
		})
		.from(teams)
		.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
		.where(eq(teamMemberships.userDbId, userDbId))
		.orderBy(asc(teams.dbId))
		.limit(1);

	if (team.length === 0) {
		throw new Error("User does not have a team");
	}
	return team[0];
}
