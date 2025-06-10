import type { ChunkStore } from "../chunk-store/types";
import type { Chunker } from "../chunker/types";
import type {
	Document,
	DocumentLoader,
	DocumentLoaderParams,
} from "../document-loader/types";
import type { Embedder } from "../embedder/types";
import { OperationError } from "../errors";

/**
 * Config for IngestPipeline
 *
 * Performance characteristics:
 * - Embedding: Batch processing using embedMany() for optimal API efficiency
 * - Database: Batch INSERT operations to minimize round-trips and parsing overhead
 * - Connection: Single connection per document with pgvector type registration caching
 * - Overall: Significant performance improvement over individual operations
 */
export interface IngestPipelineConfig<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
> {
	documentLoader: DocumentLoader<TSourceMetadata>;
	chunker: Chunker;
	embedder: Embedder;
	chunkStore: ChunkStore<TTargetMetadata>;
	/**
	 * Function to extract document key from a document
	 * This is used to uniquely identify documents in the chunk store
	 */
	documentKey: (document: Document<TSourceMetadata>) => string;
	/**
	 * Metadata transformation function
	 */
	metadataTransform: (metadata: TSourceMetadata) => TTargetMetadata;
	// options
	options?: {
		batchSize?: number; // batch size for embedding
		maxRetries?: number; // number of retries
		retryDelay?: number; // retry interval (milliseconds)
		onProgress?: (progress: IngestProgress) => void;
		onError?: (error: IngestError) => void;
	};
}

export interface IngestProgress {
	totalDocuments: number;
	processedDocuments: number;
	currentDocument?: string;
	totalChunks: number;
	processedChunks: number;
}

export interface IngestError {
	document: string;
	error: Error;
	willRetry: boolean;
	attemptNumber: number;
}

export interface IngestResult {
	totalDocuments: number;
	successfulDocuments: number;
	failedDocuments: number;
	totalChunks: number;
	errors: Array<{ document: string; error: Error }>;
}

export class IngestPipeline<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
> {
	private documentLoader: DocumentLoader<TSourceMetadata>;
	private chunker: Chunker;
	private embedder: Embedder;
	private chunkStore: ChunkStore<TTargetMetadata>;
	private documentKey: (document: Document<TSourceMetadata>) => string;
	private metadataTransform: (metadata: TSourceMetadata) => TTargetMetadata;
	private options: Required<
		NonNullable<
			IngestPipelineConfig<TSourceMetadata, TTargetMetadata>["options"]
		>
	>;

	constructor(config: IngestPipelineConfig<TSourceMetadata, TTargetMetadata>) {
		this.documentLoader = config.documentLoader;
		this.chunker = config.chunker;
		this.embedder = config.embedder;
		this.chunkStore = config.chunkStore;
		this.documentKey = config.documentKey;
		this.metadataTransform = config.metadataTransform;
		this.options = {
			batchSize: 100,
			maxRetries: 3,
			retryDelay: 1000,
			onProgress: () => {},
			onError: () => {},
			...config.options,
		};
	}

	async ingest(params: unknown): Promise<IngestResult> {
		const result: IngestResult = {
			totalDocuments: 0,
			successfulDocuments: 0,
			failedDocuments: 0,
			totalChunks: 0,
			errors: [],
		};

		const progress: IngestProgress = {
			totalDocuments: 0,
			processedDocuments: 0,
			totalChunks: 0,
			processedChunks: 0,
		};

		try {
			// process documents
			for await (const document of this.documentLoader.load(
				params as DocumentLoaderParams,
			)) {
				result.totalDocuments++;
				progress.totalDocuments++;
				progress.currentDocument = this.getDocumentKey(document);

				try {
					await this.processDocument(document);
					result.successfulDocuments++;
					progress.processedDocuments++;
				} catch (error) {
					result.failedDocuments++;
					result.errors.push({
						document: progress.currentDocument,
						error: error instanceof Error ? error : new Error(String(error)),
					});
				}

				this.options.onProgress(progress);
			}
		} catch (error) {
			throw OperationError.invalidOperation(
				"ingestion pipeline",
				"Failed to complete ingestion pipeline",
				{ cause: error instanceof Error ? error.message : String(error) },
			);
		}

		return result;
	}

	private async processDocument(
		document: Document<TSourceMetadata>,
	): Promise<void> {
		const documentKey = this.getDocumentKey(document);

		// apply metadata transformation
		const targetMetadata = this.getTargetMetadata(document.metadata);

		// with retry logic
		for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
			try {
				// chunking
				const chunkTexts = this.chunker.chunk(document.content);

				// batch embedding
				const chunks = [];
				for (let i = 0; i < chunkTexts.length; i += this.options.batchSize) {
					const batch = chunkTexts.slice(i, i + this.options.batchSize);
					const embeddings = await this.embedder.embedMany(batch);

					for (let j = 0; j < batch.length; j++) {
						chunks.push({
							content: batch[j],
							index: i + j,
							embedding: embeddings[j],
						});
					}
				}

				// save with transformed metadata
				await this.chunkStore.insert(documentKey, chunks, targetMetadata);
				return;
			} catch (error) {
				const isLastAttempt = attempt === this.options.maxRetries;

				this.options.onError({
					document: documentKey,
					error: error instanceof Error ? error : new Error(String(error)),
					willRetry: !isLastAttempt,
					attemptNumber: attempt,
				});

				if (isLastAttempt) {
					throw error;
				}

				// exponential backoff
				const delay = this.options.retryDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	/**
	 * metadata transformation
	 */
	private getTargetMetadata(sourceMetadata: TSourceMetadata): TTargetMetadata {
		return this.metadataTransform(sourceMetadata);
	}

	/**
	 * Get document key using the provided documentKey function
	 */
	private getDocumentKey(document: Document<TSourceMetadata>): string {
		return this.documentKey(document);
	}
}
