import { fetchCurrentTeam } from "@/services/teams";
import { getDataStoreQuota } from "@/services/teams/plan-features/data-store";
import { getDataStores } from "./actions";
import { DataStoresPageClient } from "./page.client";

export default async function DataStoresPage() {
	const team = await fetchCurrentTeam();
	const quota = getDataStoreQuota(team.plan);
	const dataStores = await getDataStores();
	const usageCount = dataStores.length;
	const hasAccess = quota.isAvailable;
	const hasReachedLimit = hasAccess && usageCount >= quota.maxStores;
	const createDisabled = !hasAccess || hasReachedLimit;
	const createDisabledReason = !hasAccess
		? "Data Stores are only available with the Pro or Team plans."
		: hasReachedLimit
			? "You've reached the maximum number of Data Stores included in your plan."
			: undefined;

	return (
		<DataStoresPageClient
			dataStores={dataStores}
			hasAccess={hasAccess}
			maxStores={quota.maxStores}
			teamPlan={team.plan}
			createDisabled={createDisabled}
			createDisabledReason={createDisabledReason}
		/>
	);
}
