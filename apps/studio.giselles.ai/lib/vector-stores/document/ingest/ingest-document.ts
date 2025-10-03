import type {
	EmbeddingDimensions,
	EmbeddingProfileId,
} from "@giselle-sdk/data-type";
import type { DocumentVectorStoreSourceId } from "@giselles-ai/types";
import { createClient } from "@supabase/supabase-js";
import { and, eq, lt, or } from "drizzle-orm";
import { db, documentVectorStoreSources } from "@/drizzle";
import {
	deleteDocumentEmbeddingsByProfiles,
	getDocumentVectorStoreSource,
	insertDocumentEmbeddings,
	updateDocumentVectorStoreSourceStatus,
} from "../database";
import { chunkText } from "./chunk-text";
import { extractTextFromDocument } from "./extract-text";
import { generateEmbeddings } from "./generate-embeddings";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IngestDocumentOptions {
	embeddingProfileIds: EmbeddingProfileId[];
	signal?: AbortSignal;
}

interface IngestDocumentResult {
	sourceId: DocumentVectorStoreSourceId;
	text?: string;
	fileType?: "txt" | "md";
	chunks?: string[];
	chunkCount?: number;
	embeddingProfileIds?: EmbeddingProfileId[];
	embeddingCount?: number;
	success: boolean;
	skipped?: boolean;
	reason?: string;
}

type IngestErrorCode =
	| "source-not-found"
	| "file-not-found"
	| "extraction-failed"
	| "chunking-failed"
	| "embedding-failed"
	| "unsupported-type"
	| "invalid-state";

/**
 * Ingest a document source by extracting, chunking, and embedding text content
 * This function:
 * 1. Validates the source exists and is in the correct state
 * 2. Downloads the file from Supabase storage
 * 3. Extracts text content (for TXT/MD files)
 * 4. Chunks the text into smaller pieces for embedding
 * 5. Generates embeddings for each chunk using specified embedding profiles
 * 6. Stores embeddings in the database
 * 7. Updates the source status
 *
 * @param sourceId - Document vector store source ID
 * @param options - Ingestion settings including embedding profiles
 * @returns Ingestion result with extracted text, chunks, and embeddings
 * @throws Error with code if ingestion fails
 */
export async function ingestDocument(
	sourceId: DocumentVectorStoreSourceId,
	options: IngestDocumentOptions,
): Promise<IngestDocumentResult> {
	const { embeddingProfileIds, signal } = options;

	try {
		signal?.throwIfAborted();

		// Atomically claim this document for processing
		// This prevents race conditions between after() hook, cron job, and multiple cron instances
		const STALE_THRESHOLD_MINUTES = 15;
		const staleThreshold = new Date(
			Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000,
		);

		const claimResult = await db
			.update(documentVectorStoreSources)
			.set({
				ingestStatus: "running",
				ingestErrorCode: null, // Clear any previous error
				updatedAt: new Date(), // Reset stale detection timer
			})
			.where(
				and(
					eq(documentVectorStoreSources.id, sourceId),
					eq(documentVectorStoreSources.uploadStatus, "uploaded"), // Only claim uploaded documents
					or(
						// Claim idle documents
						eq(documentVectorStoreSources.ingestStatus, "idle"),
						// Claim stale running documents
						and(
							eq(documentVectorStoreSources.ingestStatus, "running"),
							lt(documentVectorStoreSources.updatedAt, staleThreshold),
						),
					),
				),
			);

		// Check if we successfully claimed the document
		if (claimResult.rowCount === 0) {
			// Document is already being processed by another worker
			console.log(`Document ${sourceId} is already being processed, skipping`);
			return {
				sourceId,
				success: false,
				skipped: true,
				reason: "already-processing",
			};
		}

		// Get source from database
		const source = await getDocumentVectorStoreSource(sourceId);

		if (!source) {
			throw Object.assign(new Error("Source not found"), {
				code: "source-not-found" as IngestErrorCode,
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

		// Chunk the text into smaller pieces
		let chunkResult: ReturnType<typeof chunkText>;
		try {
			chunkResult = chunkText(text, { signal });
		} catch (error) {
			throw Object.assign(new Error("Text chunking failed"), {
				code: "chunking-failed" as IngestErrorCode,
				cause: error,
			});
		}

		signal?.throwIfAborted();

		// Validate embedding profiles exist
		if (embeddingProfileIds.length === 0) {
			throw Object.assign(
				new Error("No embedding profiles configured for this vector store"),
				{ code: "embedding-failed" as IngestErrorCode },
			);
		}

		// Generate embeddings for each embedding profile and store in database
		let totalEmbeddingCount = 0;
		const insertedProfileIds: EmbeddingProfileId[] = [];

		try {
			for (const embeddingProfileId of embeddingProfileIds) {
				signal?.throwIfAborted();

				const embeddingResult = await generateEmbeddings({
					chunks: chunkResult.chunks,
					embeddingProfileId,
					signal,
				});

				signal?.throwIfAborted();

				// Insert embeddings into database
				await insertDocumentEmbeddings({
					storeDbId: source.documentVectorStoreDbId,
					sourceDbId: source.dbId,
					embeddingProfileId,
					dimensions: embeddingResult.dimensions as EmbeddingDimensions,
					documentKey: source.fileName,
					embeddings: embeddingResult.embeddings,
				});

				insertedProfileIds.push(embeddingProfileId);
				totalEmbeddingCount += embeddingResult.embeddingCount;
			}
		} catch (error) {
			// Rollback: delete partially inserted embeddings
			if (insertedProfileIds.length > 0) {
				try {
					await deleteDocumentEmbeddingsByProfiles({
						sourceDbId: source.dbId,
						embeddingProfileIds: insertedProfileIds,
					});
				} catch (rollbackError) {
					console.error(
						"Failed to rollback embeddings after ingestion error:",
						rollbackError,
					);
				}
			}

			throw Object.assign(new Error("Failed to generate or store embeddings"), {
				code: "embedding-failed" as IngestErrorCode,
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
			chunks: chunkResult.chunks,
			chunkCount: chunkResult.chunkCount,
			embeddingProfileIds,
			embeddingCount: totalEmbeddingCount,
			success: true,
		};
	} catch (error) {
		// Handle abort
		if (signal?.aborted) {
			try {
				await updateDocumentVectorStoreSourceStatus({
					sourceId,
					ingestStatus: "idle",
					ingestErrorCode: null,
				});
			} catch (updateError) {
				console.error("Failed to update status on abort:", updateError);
			}
			throw error;
		}

		// Handle other errors
		// Mark as 'failed' for permanent errors that should not be retried by cron job
		// (e.g., unsupported file type, missing API keys, invalid embedding profiles)
		const errorCode =
			error && typeof error === "object" && "code" in error
				? (error.code as IngestErrorCode)
				: ("extraction-failed" as IngestErrorCode);

		try {
			await updateDocumentVectorStoreSourceStatus({
				sourceId,
				ingestStatus: "failed",
				ingestErrorCode: errorCode,
			});
		} catch (updateError) {
			console.error("Failed to update status on error:", updateError);
		}

		throw error;
	}
}
