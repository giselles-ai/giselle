import type { ChunkStore } from "../chunk-store/types";
import { createDefaultChunker } from "../chunker";
import type { ChunkerFunction } from "../chunker/types";
import type { DocumentLoader } from "../document-loader/types";
import { createDefaultEmbedder } from "../embedder";
import type { EmbedderFunction } from "../embedder/types";
import type { Document } from "../document-loader/types";
import { OperationError } from "../errors";
import { embedContent } from "./embedder";
import { retryOperation } from "./retry";
import type { IngestError, IngestProgress, IngestResult } from "./types";
import { createVersionTracker } from "./version-tracker";

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
export function createPipeline<
	TDocMetadata extends Record<string, unknown>,
	TStore extends ChunkStore<Record<string, unknown>>,
>(options: IngestPipelineOptions<TDocMetadata, TStore>): IngestFunction {
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
	 * Process a single document
	 */
	async function processDocument(
		document: Document<TDocMetadata>,
	): Promise<void> {
		const docKey = documentKey(document.metadata);
		const targetMetadata = metadataTransform(document.metadata);

		await retryOperation(
			async () => {
				const chunks = await embedContent(
					document.content,
					chunker,
					embedder,
					maxBatchSize,
				);
				await chunkStore.insert(docKey, chunks, targetMetadata);
			},
			{
				maxRetries,
				retryDelay,
				onError,
				context: docKey,
			},
		);
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
			// Initialize version tracking
			const existingDocs = await chunkStore.getDocumentVersions();
			const existingVersions = new Map(
				existingDocs.map((doc) => [doc.documentKey, doc.version]),
			);
			const versionTracker = createVersionTracker(existingVersions);

			// Process all documents
			for await (const metadata of documentLoader.loadMetadata()) {
				const docKey = documentKey(metadata);
				const newVersion = documentVersion(metadata);
				versionTracker.trackSeen(docKey);

				if (!versionTracker.isUpdateNeeded(docKey, newVersion)) {
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
				} catch (error) {
					result.failedDocuments++;
					result.errors.push({
						document: docKey,
						error: error instanceof Error ? error : new Error(String(error)),
					});
				}

				progress.processedDocuments++;
				onProgress?.(progress);
			}

			// Handle orphaned documents
			const orphanedKeys = versionTracker.getOrphaned();
			if (orphanedKeys.length > 0) {
				try {
					await chunkStore.deleteBatch(orphanedKeys);
					const deletedCount = orphanedKeys.length;

					if (onProgress) {
						progress.processedDocuments += deletedCount;
						onProgress(progress);
					}
				} catch (error) {
					result.errors.push({
						document: `batch-delete: ${orphanedKeys.join(", ")}`,
						error: error instanceof Error ? error : new Error(String(error)),
					});
				}
			}

			return result;
		} catch (error) {
			throw OperationError.invalidOperation(
				"ingestion pipeline",
				"Failed to complete ingestion pipeline",
				{ cause: error instanceof Error ? error.message : String(error) },
			);
		}
	};
}
