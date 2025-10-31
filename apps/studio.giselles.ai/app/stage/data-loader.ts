import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { getAccountInfo } from "../(main)/settings/account/actions";

export async function dataLoader() {
	const accountInfo = await getAccountInfo();
	const currentTeam = await fetchCurrentTeam();
	const isPro = isProPlan(currentTeam);
	return {
		displayName: accountInfo.displayName ?? undefined,
		email: accountInfo.email ?? undefined,
		avatarUrl: accountInfo.avatarUrl ?? undefined,
		planName: isPro ? "Pro plan" : "Free plan",
	};
}
