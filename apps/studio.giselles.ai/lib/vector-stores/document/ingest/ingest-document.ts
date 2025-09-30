import type { DocumentVectorStoreSourceId } from "@giselles-ai/types";
import { createClient } from "@supabase/supabase-js";
import {
	getDocumentVectorStoreSource,
	updateDocumentVectorStoreSourceStatus,
} from "../database";
import { extractTextFromDocument } from "./extract-text";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface IngestDocumentOptions {
	signal?: AbortSignal;
}

export interface IngestDocumentResult {
	sourceId: DocumentVectorStoreSourceId;
	text: string;
	fileType: "txt" | "md";
	success: boolean;
}

export type IngestErrorCode =
	| "source-not-found"
	| "file-not-found"
	| "extraction-failed"
	| "unsupported-type"
	| "invalid-state";

/**
 * Ingest a document source by extracting text content
 * This function:
 * 1. Validates the source exists and is in the correct state
 * 2. Downloads the file from Supabase storage
 * 3. Extracts text content (for TXT/MD files)
 * 4. Updates the source status
 *
 * @param sourceId - Document vector store source ID
 * @param options - Optional ingestion settings
 * @returns Ingestion result with extracted text
 * @throws Error with code if ingestion fails
 */
export async function ingestDocument(
	sourceId: DocumentVectorStoreSourceId,
	options?: IngestDocumentOptions,
): Promise<IngestDocumentResult> {
	const { signal } = options ?? {};

	try {
		signal?.throwIfAborted();

		// Mark as running
		await updateDocumentVectorStoreSourceStatus({
			sourceId,
			ingestStatus: "running",
			ingestErrorCode: null,
		});

		// Get source from database
		const source = await getDocumentVectorStoreSource(sourceId);

		if (!source) {
			throw Object.assign(new Error("Source not found"), {
				code: "source-not-found" as IngestErrorCode,
			});
		}

		// Validate source state
		if (source.uploadStatus !== "uploaded") {
			throw Object.assign(new Error("Source upload is not completed"), {
				code: "invalid-state" as IngestErrorCode,
			});
		}

		signal?.throwIfAborted();

		// Download file from storage
		const { data: fileData, error: downloadError } = await supabase.storage
			.from(source.storageBucket)
			.download(source.storageKey);

		if (downloadError || !fileData) {
			throw Object.assign(
				new Error(`Failed to download file: ${downloadError?.message}`),
				{ code: "file-not-found" as IngestErrorCode },
			);
		}

		signal?.throwIfAborted();

		// Convert blob to buffer
		const arrayBuffer = await fileData.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Extract text content
		let text: string;
		let fileType: "txt" | "md";

		try {
			const result = extractTextFromDocument(buffer, source.fileName, {
				signal,
			});
			text = result.text;
			fileType = result.fileType;
		} catch (error) {
			if (error instanceof Error && error.message.includes("Unsupported")) {
				throw Object.assign(error, {
					code: "unsupported-type" as IngestErrorCode,
				});
			}
			throw Object.assign(new Error("Text extraction failed"), {
				code: "extraction-failed" as IngestErrorCode,
				cause: error,
			});
		}

		signal?.throwIfAborted();

		// Mark as completed
		await updateDocumentVectorStoreSourceStatus({
			sourceId,
			ingestStatus: "completed",
			ingestErrorCode: null,
			ingestedAt: new Date(),
		});

		return {
			sourceId,
			text,
			fileType,
			success: true,
		};
	} catch (error) {
		// Handle abort
		if (signal?.aborted) {
			await updateDocumentVectorStoreSourceStatus({
				sourceId,
				ingestStatus: "idle",
				ingestErrorCode: null,
			});
			throw error;
		}

		// Handle other errors
		const errorCode =
			error && typeof error === "object" && "code" in error
				? (error.code as IngestErrorCode)
				: ("extraction-failed" as IngestErrorCode);

		await updateDocumentVectorStoreSourceStatus({
			sourceId,
			ingestStatus: "failed",
			ingestErrorCode: errorCode,
		});

		throw error;
	}
}
