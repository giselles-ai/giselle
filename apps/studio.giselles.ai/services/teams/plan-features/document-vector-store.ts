import type { TeamPlan } from "@/db/schema";

type DocumentVectorStoreQuota = {
	isAvailable: boolean;
	maxStores: number;
};

const DOCUMENT_VECTOR_STORE_QUOTAS: Record<TeamPlan, DocumentVectorStoreQuota> =
	{
		free: { isAvailable: false, maxStores: 0 },
		pro: { isAvailable: true, maxStores: 5 },
		team: { isAvailable: true, maxStores: 20 },
		// NOTE: Enterprise uses temporary values until we support per-contract limits.
		enterprise: { isAvailable: true, maxStores: 100 },
		internal: { isAvailable: true, maxStores: 100 },
	};

export function getDocumentVectorStoreQuota(
	plan: TeamPlan,
): DocumentVectorStoreQuota {
	return DOCUMENT_VECTOR_STORE_QUOTAS[plan];
}

export function canUseDocumentVectorStores(plan: TeamPlan): boolean {
	return DOCUMENT_VECTOR_STORE_QUOTAS[plan].isAvailable;
}

export function getDocumentVectorStoreLimit(plan: TeamPlan): number {
	return DOCUMENT_VECTOR_STORE_QUOTAS[plan].maxStores;
}
