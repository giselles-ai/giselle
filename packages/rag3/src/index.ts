// Errors
export {
	Rag3Error,
	ValidationError,
	DatabaseError,
	EmbeddingError,
} from "./errors";

// Database
export { PoolManager } from "./database";
export type {
	DatabaseConfig,
	RequiredColumns,
	ColumnMapping,
} from "./database";

// Document Loader
export type {
	Document,
	DocumentLoader,
	DocumentLoaderParams,
} from "./document-loader";

// Chunk Store
export type {
	Chunk,
	ChunkWithEmbedding,
	ChunkStore,
	PostgresChunkStoreConfig,
} from "./chunk-store";
export { PostgresChunkStore } from "./chunk-store";

// Query Service
export type {
	QueryResult,
	QueryService,
	PostgresQueryServiceConfig,
	DistanceFunction,
} from "./query-service";
export { PostgresQueryService } from "./query-service";

// Embedder
export type { Embedder, OpenAIEmbedderConfig } from "./embedder";
export { OpenAIEmbedder } from "./embedder";

// Chunker
export type { Chunker, LineChunkerOptions } from "./chunker";
export { LineChunker } from "./chunker";

// Ingest Pipeline
export {
	IngestPipeline,
	type IngestPipelineConfig,
	type IngestProgress,
	type IngestError,
	type IngestResult,
} from "./ingest";
