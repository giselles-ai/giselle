"use server";

import { fetchCurrentTeam } from "@/services/teams";
import { upgradeTeam } from "./upgrade-team";

export async function upgradeCurrentTeam() {
	const team = await fetchCurrentTeam();
	await upgradeTeam(team);
}
