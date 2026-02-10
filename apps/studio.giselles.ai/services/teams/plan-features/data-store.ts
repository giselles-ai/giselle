import type { TeamPlan } from "@/db/schema";

type DataStoreQuota = {
	isAvailable: boolean;
	maxStores: number;
};

const DATA_STORE_QUOTAS: Record<TeamPlan, DataStoreQuota> = {
	free: { isAvailable: false, maxStores: 0 },
	pro: { isAvailable: true, maxStores: 10 },
	team: { isAvailable: true, maxStores: 20 },
	// NOTE: Enterprise uses temporary values until we support per-contract limits.
	enterprise: { isAvailable: true, maxStores: 100 },
	internal: { isAvailable: true, maxStores: 100 },
};

export function getDataStoreQuota(plan: TeamPlan): DataStoreQuota {
	return DATA_STORE_QUOTAS[plan];
}

export function canUseDataStore(plan: TeamPlan): boolean {
	return DATA_STORE_QUOTAS[plan].isAvailable;
}

export function getDataStoreLimit(plan: TeamPlan): number {
	return DATA_STORE_QUOTAS[plan].maxStores;
}
