import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import {
	db,
	documentEmbeddingProfiles,
	documentVectorStoreSources,
	documentVectorStores,
} from "@/db";
import { fetchCurrentTeam } from "@/services/teams";
import { officialVectorStoreConfig } from "../official-config";

export type DocumentVectorStoreWithProfiles =
	typeof documentVectorStores.$inferSelect & {
		embeddingProfileIds: number[];
		sources: (typeof documentVectorStoreSources.$inferSelect)[];
	};

async function fetchDocumentVectorStoresWithCondition(
	whereCondition: SQL | undefined,
): Promise<DocumentVectorStoreWithProfiles[]> {
	const records = await db
		.select({
			store: documentVectorStores,
			embeddingProfileId: documentEmbeddingProfiles.embeddingProfileId,
		})
		.from(documentVectorStores)
		.leftJoin(
			documentEmbeddingProfiles,
			eq(
				documentEmbeddingProfiles.documentVectorStoreDbId,
				documentVectorStores.dbId,
			),
		)
		.where(whereCondition)
		.orderBy(desc(documentVectorStores.createdAt));

	const storeMap = new Map<number, DocumentVectorStoreWithProfiles>();

	for (const record of records) {
		const { store, embeddingProfileId } = record;
		const existing = storeMap.get(store.dbId);
		if (!existing) {
			storeMap.set(store.dbId, {
				...store,
				embeddingProfileIds:
					embeddingProfileId !== null && embeddingProfileId !== undefined
						? [embeddingProfileId]
						: [],
				sources: [],
			});
			continue;
		}
		if (embeddingProfileId !== null && embeddingProfileId !== undefined) {
			existing.embeddingProfileIds.push(embeddingProfileId);
		}
	}

	const storeDbIds = Array.from(storeMap.keys());
	if (storeDbIds.length === 0) {
		return [];
	}

	const sourceRecords = await db
		.select({
			storeDbId: documentVectorStoreSources.documentVectorStoreDbId,
			source: documentVectorStoreSources,
		})
		.from(documentVectorStoreSources)
		.where(
			inArray(documentVectorStoreSources.documentVectorStoreDbId, storeDbIds),
		)
		.orderBy(desc(documentVectorStoreSources.createdAt));

	for (const record of sourceRecords) {
		const store = storeMap.get(record.storeDbId);
		if (store) {
			store.sources.push(record.source);
		}
	}

	return Array.from(storeMap.values());
}

export async function getDocumentVectorStores(
	teamDbId?: number,
): Promise<DocumentVectorStoreWithProfiles[]> {
	const targetTeamDbId = teamDbId ?? (await fetchCurrentTeam()).dbId;
	return fetchDocumentVectorStoresWithCondition(
		eq(documentVectorStores.teamDbId, targetTeamDbId),
	);
}

/**
 * Get official Document Vector Stores.
 * Returns empty array if official feature is disabled.
 */
export function getOfficialDocumentVectorStores(): Promise<
	DocumentVectorStoreWithProfiles[]
> {
	const { teamDbId, documentStoreIds } = officialVectorStoreConfig;
	if (teamDbId === null || documentStoreIds.length === 0) {
		return Promise.resolve([]);
	}

	return fetchDocumentVectorStoresWithCondition(
		and(
			eq(documentVectorStores.teamDbId, teamDbId),
			inArray(documentVectorStores.id, documentStoreIds),
		),
	);
}
