import type { EmbeddingProfileId } from "@giselles-ai/protocol";
import { and, eq, inArray, lt, or } from "drizzle-orm";
import {
	db,
	documentEmbeddingProfiles,
	documentVectorStoreSources,
	documentVectorStores,
} from "@/db";
import type { DocumentVectorStoreSourceId } from "@/packages/types";

const STALE_THRESHOLD_MINUTES = 15;

interface DocumentIngestTarget {
	sourceId: DocumentVectorStoreSourceId;
	sourceDbId: number;
	embeddingProfileIds: EmbeddingProfileId[];
}

/**
 * Fetch document sources that need to be ingested
 *
 * Target documents are:
 * - idle: Newly uploaded documents waiting for initial ingestion
 * - running and updated more than 15 minutes ago (stale): Likely interrupted by timeout
 *
 * NOTE: Documents with 'failed' status are intentionally excluded.
 * Failed ingestions indicate permanent errors (invalid file, missing API keys, etc.)
 * that would repeatedly fail. These require manual intervention or re-upload.
 *
 * @returns Document sources to ingest
 */
export async function fetchIngestTargets(): Promise<DocumentIngestTarget[]> {
	// Consider running status as stale if it hasn't been updated for 15 minutes
	const staleThreshold = new Date(
		Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000,
	);

	// Get sources that need ingestion
	const sources = await db
		.select({
			id: documentVectorStoreSources.id,
			dbId: documentVectorStoreSources.dbId,
			documentVectorStoreDbId:
				documentVectorStoreSources.documentVectorStoreDbId,
			ingestStatus: documentVectorStoreSources.ingestStatus,
			updatedAt: documentVectorStoreSources.updatedAt,
		})
		.from(documentVectorStoreSources)
		.where(
			or(
				eq(documentVectorStoreSources.ingestStatus, "idle"),
				and(
					eq(documentVectorStoreSources.ingestStatus, "running"),
					lt(documentVectorStoreSources.updatedAt, staleThreshold),
				),
			),
		);

	if (sources.length === 0) {
		return [];
	}

	// Get embedding profiles for the stores
	const storeDbIds = Array.from(
		new Set(sources.map((s) => s.documentVectorStoreDbId)),
	);

	const storeProfiles = await db
		.select({
			storeDbId: documentVectorStores.dbId,
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
		.where(inArray(documentVectorStores.dbId, storeDbIds));

	// Build map of store -> embedding profiles
	const profileMap = new Map<number, EmbeddingProfileId[]>();
	for (const record of storeProfiles) {
		if (record.embeddingProfileId) {
			const profiles = profileMap.get(record.storeDbId) ?? [];
			profiles.push(record.embeddingProfileId);
			profileMap.set(record.storeDbId, profiles);
		}
	}

	// Build ingest targets
	return sources.map((source) => ({
		sourceId: source.id,
		sourceDbId: source.dbId,
		embeddingProfileIds: profileMap.get(source.documentVectorStoreDbId) ?? [],
	}));
}
