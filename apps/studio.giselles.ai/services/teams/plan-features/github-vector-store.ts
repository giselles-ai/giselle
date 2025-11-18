import type { TeamPlan } from "@/db/schema";

type GitHubVectorStoreQuota = {
	isAvailable: boolean;
	maxStores: number;
};

const GITHUB_VECTOR_STORE_QUOTAS: Record<TeamPlan, GitHubVectorStoreQuota> = {
	free: { isAvailable: false, maxStores: 0 },
	pro: { isAvailable: true, maxStores: 3 },
	team: { isAvailable: true, maxStores: 10 },
	// NOTE: Enterprise uses temporary values until we support per-contract limits.
	enterprise: { isAvailable: true, maxStores: 100 },
	internal: { isAvailable: true, maxStores: 100 },
};

export function getGitHubVectorStoreQuota(
	plan: TeamPlan,
): GitHubVectorStoreQuota {
	return GITHUB_VECTOR_STORE_QUOTAS[plan];
}

export function canUseGitHubVectorStores(plan: TeamPlan): boolean {
	return GITHUB_VECTOR_STORE_QUOTAS[plan].isAvailable;
}

export function getGitHubVectorStoreLimit(plan: TeamPlan): number {
	return GITHUB_VECTOR_STORE_QUOTAS[plan].maxStores;
}
