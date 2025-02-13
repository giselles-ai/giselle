import { updateGiselleSession } from "@/lib/giselle-session";
import { fetchUserTeams } from "./";
import type { TeamId } from "./types";

export async function setCurrentTeam(teamId: TeamId) {
	const teams = await fetchUserTeams();
	const team = teams.find((t) => t.id === teamId);
	if (team == null) {
		throw new Error("Team not found");
	}
	await updateGiselleSession({ teamId });
}
