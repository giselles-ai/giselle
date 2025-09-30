import type { DocumentVectorStoreSourceId } from "@giselles-ai/types";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import type {
	DocumentVectorStoreSourceIngestStatus,
	DocumentVectorStoreSourceUploadStatus,
} from "@/drizzle/schema";
import { documentVectorStoreSources } from "@/drizzle/schema";

export async function getDocumentVectorStoreSource(
	sourceId: DocumentVectorStoreSourceId,
) {
	const source = await db.query.documentVectorStoreSources.findFirst({
		where: eq(documentVectorStoreSources.id, sourceId),
	});

	return source ?? null;
}

export interface UpdateSourceStatusParams {
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
