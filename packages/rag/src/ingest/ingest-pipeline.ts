import type { ChunkStore, ChunkWithEmbedding } from "../chunk-store/types";
import { createDefaultChunker } from "../chunker";
import type { ChunkerFunction } from "../chunker/types";
import type { Document, DocumentLoader } from "../document-loader/types";
import { createDefaultEmbedder } from "../embedder";
import type { EmbedderFunction } from "../embedder/types";
import { OperationError } from "../errors";
import type { IngestError, IngestProgress, IngestResult } from "./types";

// Type helper to extract metadata type from ChunkStore
type InferChunkMetadata<T> = T extends ChunkStore<infer M> ? M : never;

export interface IngestPipelineOptions<
	TDocMetadata extends Record<string, unknown>,
	TStore extends ChunkStore<Record<string, unknown>>,
> {
	// Required configuration
	documentLoader: DocumentLoader<TDocMetadata>;
	chunkStore: TStore;
	documentKey: (metadata: TDocMetadata) => string;
	documentVersion: (metadata: TDocMetadata) => string;
	metadataTransform: (metadata: TDocMetadata) => InferChunkMetadata<TStore>;

	// Optional processors
	chunker?: ChunkerFunction;
	embedder?: EmbedderFunction;

	// Optional settings
	maxBatchSize?: number;
	maxRetries?: number;
	retryDelay?: number;
	onProgress?: (progress: IngestProgress) => void;
	onError?: (error: IngestError) => void;
}

const DEFAULT_MAX_BATCH_SIZE = 100;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

export type IngestFunction = () => Promise<IngestResult>;

/**
 * Create a differential ingest pipeline that only processes new or changed documents
 */
export function createIngestPipeline<
	TDocMetadata extends Record<string, unknown>,
	TStore extends ChunkStore<Record<string, unknown>>,
>(options: IngestPipelineOptions<TDocMetadata, TStore>): IngestFunction {
	// Extract and set defaults for all options
	const {
		documentLoader,
		chunkStore,
		documentKey,
		documentVersion,
		metadataTransform,
		chunker = createDefaultChunker(),
		embedder = createDefaultEmbedder(),
		maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
		maxRetries = DEFAULT_MAX_RETRIES,
		retryDelay = DEFAULT_RETRY_DELAY,
		onProgress = () => {},
		onError = () => {},
	} = options;

	/**
	 * Process a single document with retry logic
	 */
	async function processDocument(
		document: Document<TDocMetadata>,
	): Promise<void> {
		const targetMetadata = metadataTransform(document.metadata);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const chunkTexts = chunker(document.content);
				const chunks: ChunkWithEmbedding[] = [];

				// Batch embedding to improve performance
				for (let i = 0; i < chunkTexts.length; i += maxBatchSize) {
					const batch = chunkTexts.slice(i, i + maxBatchSize);
					const embeddings = await embedder.embedMany(batch);

					for (let j = 0; j < batch.length; j++) {
						chunks.push({
							content: batch[j],
							index: i + j,
							embedding: embeddings[j],
						});
					}
				}

				await chunkStore.insert(
					documentKey(document.metadata),
					chunks,
					targetMetadata,
				);
				return;
			} catch (error) {
				const isLastAttempt = attempt === maxRetries;

				onError({
					document: documentKey(document.metadata),
					error: error instanceof Error ? error : new Error(String(error)),
					willRetry: !isLastAttempt,
					attemptNumber: attempt,
				});

				if (isLastAttempt) {
					throw error;
				}

				const delay = retryDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	/**
	 * Process a batch of documents
	 */
	async function processBatch(
		documents: Array<Document<TDocMetadata>>,
		result: IngestResult,
		progress: IngestProgress,
	): Promise<void> {
		for (const document of documents) {
			const docKey = documentKey(document.metadata);
			progress.currentDocument = docKey;

			try {
				await processDocument(document);
				result.successfulDocuments++;
				progress.processedDocuments++;
			} catch (error) {
				result.failedDocuments++;
				progress.processedDocuments++;
				result.errors.push({
					document: docKey,
					error: error instanceof Error ? error : new Error(String(error)),
				});
			}

			onProgress(progress);
		}
	}

	/**
	 * The main differential ingest function
	 */
	return async function ingest(): Promise<IngestResult> {
		const result: IngestResult = {
			totalDocuments: 0,
			successfulDocuments: 0,
			failedDocuments: 0,
			errors: [],
		};

		const progress: IngestProgress = {
			processedDocuments: 0,
			currentDocument: undefined,
		};

		try {
			// Get existing document versions
			const existingDocs = await chunkStore.getDocumentVersions();
			const existingVersions = new Map(
				existingDocs.map((doc) => [doc.documentKey, doc.version]),
			);

			// Track which documents we've seen
			const seenDocuments = new Set<string>();
			const documentBatch: Array<Document<TDocMetadata>> = [];

			// Process all documents from the loader
			for await (const metadata of documentLoader.loadMetadata()) {
				const docKey = documentKey(metadata);
				const newVersion = documentVersion(metadata);
				seenDocuments.add(docKey);

				// Check if document needs update
				const existingVersion = existingVersions.get(docKey);
				if (existingVersion === newVersion) {
					// Document hasn't changed, skip it
					continue;
				}

				// Load and process the document
				const document = await documentLoader.loadDocument(metadata);
				if (!document) {
					continue;
				}

				result.totalDocuments++;
				documentBatch.push(document);

				if (documentBatch.length >= maxBatchSize) {
					await processBatch(documentBatch, result, progress);
					documentBatch.length = 0;
				}
			}

			// Process remaining documents
			if (documentBatch.length > 0) {
				await processBatch(documentBatch, result, progress);
			}

			// Delete documents that no longer exist
			const deletionTasks: Array<string> = [];
			for (const [docKey] of existingVersions) {
				if (!seenDocuments.has(docKey)) {
					deletionTasks.push(docKey);
				}
			}

			// Process deletions using batch delete
			if (deletionTasks.length > 0) {
				try {
					await chunkStore.deleteBatch(deletionTasks);
					progress.processedDocuments += deletionTasks.length;
					onProgress(progress);
				} catch (error) {
					// If batch delete fails, fall back to individual deletes
					for (const docKey of deletionTasks) {
						try {
							await chunkStore.delete(docKey);
							progress.processedDocuments++;
							onProgress(progress);
						} catch (error) {
							result.errors.push({
								document: docKey,
								error:
									error instanceof Error ? error : new Error(String(error)),
							});
						}
					}
				}
			}
		} catch (error) {
			throw OperationError.invalidOperation(
				"differential ingestion",
				"Failed to complete differential ingestion",
				{ cause: error instanceof Error ? error.message : String(error) },
			);
		}

		return result;
	};
}
