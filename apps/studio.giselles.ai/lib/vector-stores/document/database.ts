import type {
	EmbeddingDimensions,
	EmbeddingProfileId,
} from "@giselle-sdk/data-type";
import type { DocumentVectorStoreSourceId } from "@giselles-ai/types";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import type {
	DocumentVectorStoreSourceIngestStatus,
	DocumentVectorStoreSourceUploadStatus,
} from "@/drizzle/schema";
import {
	documentEmbeddings,
	documentVectorStoreSources,
} from "@/drizzle/schema";

export async function getDocumentVectorStoreSource(
	sourceId: DocumentVectorStoreSourceId,
) {
	const source = await db.query.documentVectorStoreSources.findFirst({
		where: eq(documentVectorStoreSources.id, sourceId),
	});

	return source ?? null;
}

interface UpdateSourceStatusParams {
	sourceId: DocumentVectorStoreSourceId;
	uploadStatus?: DocumentVectorStoreSourceUploadStatus;
	uploadErrorCode?: string | null;
	ingestStatus?: DocumentVectorStoreSourceIngestStatus;
	ingestErrorCode?: string | null;
	ingestedAt?: Date | null;
}

export async function updateDocumentVectorStoreSourceStatus(
	params: UpdateSourceStatusParams,
) {
	const {
		sourceId,
		uploadStatus,
		uploadErrorCode,
		ingestStatus,
		ingestErrorCode,
		ingestedAt,
	} = params;

	const updateData: Record<string, unknown> = {};

	if (uploadStatus !== undefined) {
		updateData.uploadStatus = uploadStatus;
	}
	if (uploadErrorCode !== undefined) {
		updateData.uploadErrorCode = uploadErrorCode;
	}
	if (ingestStatus !== undefined) {
		updateData.ingestStatus = ingestStatus;
	}
	if (ingestErrorCode !== undefined) {
		updateData.ingestErrorCode = ingestErrorCode;
	}
	if (ingestedAt !== undefined) {
		updateData.ingestedAt = ingestedAt;
	}

	await db
		.update(documentVectorStoreSources)
		.set(updateData)
		.where(eq(documentVectorStoreSources.id, sourceId));
}

interface InsertEmbeddingsParams {
	storeDbId: number;
	sourceDbId: number;
	embeddingProfileId: EmbeddingProfileId;
	dimensions: EmbeddingDimensions;
	documentKey: string;
	embeddings: Array<{
		chunkIndex: number;
		content: string;
		embedding: number[];
	}>;
}

export async function insertDocumentEmbeddings(
	params: InsertEmbeddingsParams,
): Promise<void> {
	const {
		storeDbId,
		sourceDbId,
		embeddingProfileId,
		dimensions,
		documentKey,
		embeddings,
	} = params;

	if (embeddings.length === 0) {
		return;
	}

	// Convert embeddings to the format expected by the database
	const values = embeddings.map((emb) => ({
		documentVectorStoreSourceDbId: sourceDbId,
		documentVectorStoreDbId: storeDbId,
		embeddingProfileId,
		embeddingDimensions: dimensions,
		documentKey,
		chunkIndex: emb.chunkIndex,
		chunkContent: emb.content,
		embedding: emb.embedding,
	}));

	await db.insert(documentEmbeddings).values(values);
}

export async function deleteDocumentEmbeddingsByProfiles(params: {
	sourceDbId: number;
	embeddingProfileIds: EmbeddingProfileId[];
}): Promise<void> {
	const { sourceDbId, embeddingProfileIds } = params;

	if (embeddingProfileIds.length === 0) {
		return;
	}

	await db
		.delete(documentEmbeddings)
		.where(
			and(
				eq(documentEmbeddings.documentVectorStoreSourceDbId, sourceDbId),
				inArray(documentEmbeddings.embeddingProfileId, embeddingProfileIds),
			),
		);
}
