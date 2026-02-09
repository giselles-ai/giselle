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
			<button
				type="submit"
				className="relative inline-flex items-center justify-center gap-2 rounded-full border border-primary-400/45 bg-primary-400/55 px-4 py-1 text-sm font-medium text-white/90 shadow-[inset_0_0_10px_rgba(255,255,255,0.06)] transition-colors duration-300 hover:bg-primary-400/85 hover:text-white/90 hover:shadow-[inset_0_0_12px_rgba(255,255,255,0.08)] active:bg-primary-400/50 focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)]"
				formAction={upgradeCurrentTeam}
			>
				Upgrade
			</button>
		</form>
	);
}
