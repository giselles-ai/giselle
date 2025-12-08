import { use } from "react";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { upgradeCurrentTeam } from "@/services/teams/actions/upgrade-current-team";
import { Button } from "../../settings/components/button";

export async function getUpgradeButtonContext() {
	const currentTeam = await fetchCurrentTeam();

	return { isProPlan: isProPlan(currentTeam) };
}

type UpgradeButtonContext = Awaited<ReturnType<typeof getUpgradeButtonContext>>;
export function UpgradeButton({
	getUpgradeButtonContextPromise,
}: {
	getUpgradeButtonContextPromise: Promise<UpgradeButtonContext>;
}) {
	const { isProPlan } = use(getUpgradeButtonContextPromise);

	if (isProPlan) {
		return null;
	}

	return (
		<form className="flex items-center">
			<Button
				className="relative inline-flex items-center justify-center gap-2 duration-300 focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)] border border-primary-400 shadow-[inset_0_0_12px_rgba(255,255,255,0.08)] hover:shadow-[inset_0_0_16px_rgba(255,255,255,0.12)] px-4 py-1 text-sm font-medium text-white bg-primary-400 hover:bg-primary-400/90 rounded-full transition-colors"
				formAction={upgradeCurrentTeam}
			>
				Upgrade
			</Button>
		</form>
	);
}
