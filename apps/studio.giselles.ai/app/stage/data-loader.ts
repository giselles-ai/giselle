import { fetchCurrentTeam, fetchUserTeams, isProPlan } from "@/services/teams";
import { getAccountInfo } from "../(main)/settings/account/actions";

export async function dataLoader() {
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
}
