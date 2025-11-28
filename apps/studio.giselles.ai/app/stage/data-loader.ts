import { fetchCurrentTeam, fetchUserTeams, isProPlan } from "@/services/teams";
import type { Team, TeamId } from "@/services/teams/types";
import { getAccountInfo } from "../(main)/settings/account/actions";

export async function dataLoader() {
	try {
		const accountInfo = await getAccountInfo();
		const currentTeam = await fetchCurrentTeam();
		const allTeams = await fetchUserTeams();
		const isPro = isProPlan(currentTeam);
		return {
			displayName: accountInfo.displayName ?? undefined,
			email: accountInfo.email ?? undefined,
			avatarUrl: accountInfo.avatarUrl ?? undefined,
			currentTeam: {
				id: currentTeam.id,
				name: currentTeam.name,
				avatarUrl: currentTeam.avatarUrl ?? undefined,
				plan: currentTeam.plan,
				isPro,
			},
			allTeams: allTeams.map((t) => ({
				id: t.id,
				name: t.name,
				avatarUrl: t.avatarUrl ?? undefined,
				plan: t.plan,
				isPro: isProPlan(t),
			})),
		};
	} catch (error) {
		// Gracefully degrade the navigation rail when team/account loading fails
		// instead of crashing the whole Stage layout with a network error.
		// eslint-disable-next-line no-console
		console.error("Failed to load navigation rail user data:", error);

		const fallbackTeam: Team = {
			id: "tm_fallback" as TeamId,
			name: "Unknown team",
			avatarUrl: undefined,
			// `plan` is required; choose a reasonable default string.
			// The exact value is not critical for the navigation rail.
			plan: "free",
			isPro: false,
		};

		return {
			displayName: undefined,
			email: undefined,
			avatarUrl: undefined,
			currentTeam: fallbackTeam,
			allTeams: [fallbackTeam],
		};
	}
}
