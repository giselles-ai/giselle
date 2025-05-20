/**
 * Interface for content loader implementations
 * Responsible for loading content from various sources
 */
export interface ContentLoader<T, MetadataType = Record<string, unknown>> {
	loadStream(params: T): AsyncIterable<LoaderResult<MetadataType>>;
}

/**
 * Result of a content loader operation
 */
export interface LoaderResult<MetadataType = Record<string, unknown>> {
	content: string;
	metadata: MetadataType;
}

/**
 * Interface for chunking strategies
 */
export interface Chunker {
	chunk(content: string): AsyncGenerator<ChunkResult, void, unknown>;
}

/**
 * Result of a chunking operation
 */
export interface ChunkResult {
	content: string;
	index: number;
}

/**
 * Interface for embedding strategy
 */
export interface Embedder {
	embed(text: string): Promise<number[]>;
}

/**
 * Interface for embedding storage
 */
export interface EmbeddingStore<T = unknown> {
	startIngestion(params: Record<string, unknown>): Promise<void>;
	completeIngestion(params: Record<string, unknown>): Promise<void>;
	failIngestion(params: Record<string, unknown>, error: Error): Promise<void>;
	insertEmbedding(data: T): Promise<void>;
	updateEmbedding(data: T): Promise<void>;
	deleteEmbedding(key: Partial<T>): Promise<void>;
}

/**
 * Base embedding data structure
 */
export interface BaseEmbedding {
	id?: string;
	chunkContent: string;
	chunkIndex: number;
	embedding: number[];
}

/**
 * Interface for transforming embeddings
 */
export type EmbeddingTransformer<LoaderMetadataType, StoreDataType> = (
	baseEmbedding: BaseEmbedding,
	metadata: LoaderMetadataType,
) => StoreDataType;
