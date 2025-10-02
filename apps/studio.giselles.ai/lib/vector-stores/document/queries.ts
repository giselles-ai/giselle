import { desc, eq, inArray } from "drizzle-orm";

import {
	db,
	documentEmbeddingProfiles,
	documentVectorStoreSources,
	documentVectorStores,
} from "@/drizzle";
import { fetchCurrentTeam } from "@/services/teams";

export type DocumentVectorStoreWithProfiles =
	typeof documentVectorStores.$inferSelect & {
		embeddingProfileIds: number[];
		sources: (typeof documentVectorStoreSources.$inferSelect)[];
	};

export async function getDocumentVectorStores(): Promise<
	DocumentVectorStoreWithProfiles[]
> {
	const team = await fetchCurrentTeam();

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
		.where(eq(documentVectorStores.teamDbId, team.dbId))
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
