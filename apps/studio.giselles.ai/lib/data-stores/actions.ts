"use server";

import { getCurrentUser } from "@/lib/get-current-user";
import { isMemberOfTeam } from "@/services/teams";
import { getTeamDataStores as getTeamDataStoresQuery } from "./queries";

/**
 * Server Action to fetch data stores for a team.
 * This action performs authorization by checking team membership.
 */
export async function getTeamDataStores(teamDbId: number) {
	const currentUser = await getCurrentUser();
	const isMember = await isMemberOfTeam(currentUser.dbId, teamDbId);
	if (!isMember) {
		throw new Error("Unauthorized: User is not a member of this team");
	}
	return await getTeamDataStoresQuery(teamDbId);
}
