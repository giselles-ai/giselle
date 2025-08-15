import {
	EMBEDDING_PROFILES,
	type EmbeddingProfileId,
} from "@giselle-sdk/data-type";
import type { TelemetrySettings } from "ai";
import type { ChunkStore } from "../chunk-store/types";
import { createDefaultChunker } from "../chunker";
import type { ChunkerFunction } from "../chunker/types";
import type { Document, DocumentLoader } from "../document-loader/types";
import { createEmbedderFromProfile } from "../embedder/profiles";
import type { EmbedderFunction } from "../embedder/types";
import { ConfigurationError, OperationError } from "../errors";
import { embedContent } from "./embedder";
import type { IngestError, IngestProgress, IngestResult } from "./types";
import { createBatches, retryOperation } from "./utils";
import { createVersionTracker } from "./version-tracker";

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
	embeddingProfileId: EmbeddingProfileId;

	// Optional settings
	maxBatchSize?: number;
	maxRetries?: number;
	retryDelay?: number;
	parallelLimit?: number;
	onProgress?: (progress: IngestProgress) => void;
	onError?: (error: IngestError) => void;
	telemetry?: TelemetrySettings;
}

const DEFAULT_MAX_BATCH_SIZE = 100;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
// Balanced for GitHub API limits (5,000/h) and memory constraints.
// With differential ingest, most runs process few files.
// Initial ingests may hit rate limits but will resume automatically.
const DEFAULT_PARALLEL_LIMIT = 15;

export type IngestFunction = () => Promise<IngestResult>;

/**
 * Create an ingest pipeline function with the given options
 */
export function createPipeline<
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
		maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
		maxRetries = DEFAULT_MAX_RETRIES,
		retryDelay = DEFAULT_RETRY_DELAY,
		parallelLimit = DEFAULT_PARALLEL_LIMIT,
		onProgress = () => {},
		onError = () => {},
		telemetry,
	} = options;

	const profile = EMBEDDING_PROFILES[options.embeddingProfileId];
	if (!profile) {
		throw new ConfigurationError(
			`Invalid embedding profile ID: ${options.embeddingProfileId}`,
		);
	}

	const apiKey =
		process.env[
			profile.provider === "openai" ? "OPENAI_API_KEY" : "GOOGLE_API_KEY"
		];
	if (!apiKey) {
		throw new ConfigurationError(
			`No API key found for embedding profile ${options.embeddingProfileId}`,
		);
	}

	const resolvedEmbedder = createEmbedderFromProfile(
		options.embeddingProfileId,
		apiKey,
		{ telemetry },
	);

	/**
	 * Process a single document
	 */
	async function processDocument(
		document: Document<TDocMetadata>,
	): Promise<void> {
		let docKey: string;
		let targetMetadata: InferChunkMetadata<TStore>;
		try {
			docKey = documentKey(document.metadata);
			targetMetadata = metadataTransform(document.metadata);
		} catch (error) {
			throw OperationError.invalidOperation(
				"processDocument",
				"Failed to process document metadata",
				error instanceof Error ? error : new Error(String(error)),
			);
		}

		await retryOperation(
			async () => {
				const chunks = await embedContent(
					document.content,
					chunker,
					resolvedEmbedder as EmbedderFunction,
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
	 * Filter and prepare documents for processing
	 */
	async function* prepareDocuments(
		versionTracker: ReturnType<typeof createVersionTracker>,
		result: IngestResult,
	): AsyncGenerator<{
		metadata: TDocMetadata;
		docKey: string;
	}> {
		for await (const metadata of documentLoader.loadMetadata()) {
			let docKey: string;
			let newVersion: string;
			try {
				docKey = documentKey(metadata);
				newVersion = documentVersion(metadata);
			} catch (error) {
				result.failedDocuments++;
				result.errors.push({
					document: "<unknown>",
					error: error instanceof Error ? error : new Error(String(error)),
				});
				continue;
			}
			versionTracker.trackSeen(docKey);

			if (!versionTracker.isUpdateNeeded(docKey, newVersion)) {
				continue;
			}

			yield { metadata, docKey };
		}
	}

	/**
	 * Process a batch of documents
	 */
	async function processBatch(
		batch: Array<{ metadata: TDocMetadata; docKey: string }>,
		result: IngestResult,
		progress: IngestProgress,
	): Promise<void> {
		await Promise.all(
			batch.map(async ({ metadata, docKey }) => {
				const document = await documentLoader.loadDocument(metadata);
				if (!document) {
					return;
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
			}),
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

			// Process documents in batches
			const documentsToProcess = prepareDocuments(versionTracker, result);
			for await (const batch of createBatches(
				documentsToProcess,
				parallelLimit,
			)) {
				await processBatch(batch, result, progress);
			}

			// Handle orphaned documents
			const orphanedKeys = versionTracker.getOrphaned();
			if (orphanedKeys.length > 0) {
				try {
					await chunkStore.deleteBatch(orphanedKeys);
					const deletedCount = orphanedKeys.length;

					progress.processedDocuments += deletedCount;
					onProgress?.(progress);
				} catch (error) {
					result.errors.push({
						document: `batch-delete: ${orphanedKeys.join(", ")}`,
						error: error instanceof Error ? error : new Error(String(error)),
					});
				}
			}
		} catch (error) {
			throw OperationError.invalidOperation(
				"ingestion pipeline",
				"Failed to complete ingestion pipeline",
				error instanceof Error ? error : new Error(String(error)),
			);
		}

		return result;
	};
}
