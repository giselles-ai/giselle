import type { ChunkStore, ChunkWithEmbedding } from "../chunk-store/types";
import { createDefaultChunker } from "../chunker";
import type { ChunkerFunction } from "../chunker/types";
import type {
	Document,
	DocumentLoader,
	DocumentLoaderParams,
} from "../document-loader/types";
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
	documentLoader: DocumentLoader<TDocMetadata, DocumentLoaderParams>;
	chunkStore: TStore;
	documentKey: (document: Document<TDocMetadata>) => string;
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

export type IngestFunction = (
	params: DocumentLoaderParams,
) => Promise<IngestResult>;

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
		docKey: string,
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

				await chunkStore.insert(docKey, chunks, targetMetadata);
				return;
			} catch (error) {
				const isLastAttempt = attempt === maxRetries;

				onError({
					document: docKey,
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
			const docKey = documentKey(document);
			progress.currentDocument = docKey;

			try {
				await processDocument(document, docKey);
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
	 * The main ingest function
	 */
	return async function ingest(
		params: DocumentLoaderParams,
	): Promise<IngestResult> {
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
			const documentBatch: Array<Document<TDocMetadata>> = [];

			for await (const document of documentLoader.load(params)) {
				result.totalDocuments++;
				documentBatch.push(document);

				if (documentBatch.length >= maxBatchSize) {
					await processBatch(documentBatch, result, progress);
					documentBatch.length = 0;
				}
			}

			if (documentBatch.length > 0) {
				await processBatch(documentBatch, result, progress);
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
