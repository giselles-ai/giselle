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
 * Create an ingest pipeline function with the given options
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
	 * Create chunks with embeddings from document content
	 */
	async function createChunksWithEmbeddings(
		content: string,
	): Promise<ChunkWithEmbedding[]> {
		const chunkTexts = chunker(content);
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

		return chunks;
	}

	/**
	 * Execute an operation with retry logic
	 */
	async function withRetry<T>(
		operation: () => Promise<T>,
		documentKey: string,
	): Promise<T> {
		const attemptOperation = async (attempt = 1): Promise<T> => {
			try {
				return await operation();
			} catch (error) {
				const isLastAttempt = attempt >= maxRetries;

				onError({
					document: documentKey,
					error: error instanceof Error ? error : new Error(String(error)),
					willRetry: !isLastAttempt,
					attemptNumber: attempt,
				});

				if (isLastAttempt) {
					throw error;
				}

				const delay = retryDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));

				return attemptOperation(attempt + 1);
			}
		};

		return attemptOperation();
	}

	/**
	 * Process a single document with retry logic
	 */
	async function processDocument(
		document: Document<TDocMetadata>,
	): Promise<void> {
		const docKey = documentKey(document.metadata);
		const targetMetadata = metadataTransform(document.metadata);

		await withRetry(async () => {
			const chunks = await createChunksWithEmbeddings(document.content);
			await chunkStore.insert(docKey, chunks, targetMetadata);
		}, docKey);
	}

	/**
	 * The main ingest function
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
			const existingDocs = await chunkStore.getDocumentVersions();
			const existingVersions = new Map(
				existingDocs.map((doc) => [doc.documentKey, doc.version]),
			);

			const seenDocuments = new Set<string>();

			for await (const metadata of documentLoader.loadMetadata()) {
				const docKey = documentKey(metadata);
				const newVersion = documentVersion(metadata);
				seenDocuments.add(docKey);

				const existingVersion = existingVersions.get(docKey);
				if (existingVersion === newVersion) {
					continue;
				}

				const document = await documentLoader.loadDocument(metadata);
				if (!document) {
					continue;
				}

				result.totalDocuments++;
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

			const deletionTasks: Array<string> = [];
			for (const [docKey] of existingVersions) {
				if (!seenDocuments.has(docKey)) {
					deletionTasks.push(docKey);
				}
			}

			if (deletionTasks.length > 0) {
				try {
					await chunkStore.deleteBatch(deletionTasks);
					progress.processedDocuments += deletionTasks.length;
					onProgress(progress);
				} catch (error) {
					result.errors.push({
						document: `batch-delete: ${deletionTasks.join(", ")}`,
						error: error instanceof Error ? error : new Error(String(error)),
					});
					throw error;
				}
			}
		} catch (error) {
			throw OperationError.invalidOperation(
				"ingestion pipeline",
				"Failed to complete ingestion pipeline",
				{ cause: error instanceof Error ? error.message : String(error) },
			);
		}

		return result;
	};
}
