import { updateGiselleSession } from "@/lib/giselle-session";
import { fetchUserTeams } from "./";

export async function setCurrentTeam(teamId: string) {
	const teams = await fetchUserTeams();
	if (teams.length === 0) {
		throw new Error("No teams found");
	}
	let team = teams.find((t) => t.id === teamId);
	if (team == null) {
		// fallback to the first team
		team = teams[0];
	}
	await updateGiselleSession({ teamId: team.id });
}

export async function setCurrentTeamOrThrow(teamId: string) {
	const teams = await fetchUserTeams();
	const team = teams.find((t) => t.id === teamId);
	if (team == null) {
		throw new Error(`User is not a member of team: ${teamId}`);
	}
	await updateGiselleSession({ teamId: team.id });
}
