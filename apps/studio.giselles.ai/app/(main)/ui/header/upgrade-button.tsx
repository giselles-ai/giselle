import { Button } from "@giselle-internal/ui/button";
import { use } from "react";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { upgradeCurrentTeam } from "@/services/teams/actions/upgrade-current-team";

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
				className="px-4 py-2 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/80 rounded-lg transition-colors"
				formAction={upgradeCurrentTeam}
			>
				Upgrade
			</Button>
		</form>
	);
}
