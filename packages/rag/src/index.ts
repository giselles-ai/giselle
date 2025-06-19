// Errors
export {
	DatabaseError,
	EmbeddingError,
	RagError,
	ValidationError,
} from "./errors";

// Database
export { PoolManager } from "./database";
export type {
	ColumnMapping,
	DatabaseConfig,
	RequiredColumns,
} from "./database";

// Document Loader
export type {
	Document,
	DocumentLoader,
	DocumentLoaderParams,
} from "./document-loader";

// Chunk Store
export { createPostgresChunkStore } from "./chunk-store";
export type {
	Chunk,
	ChunkStore,
	ChunkWithEmbedding,
} from "./chunk-store";

// Query Service
export { PostgresQueryService } from "./query-service";
export type {
	DistanceFunction,
	QueryResult,
	QueryService,
} from "./query-service";

// Embedder
export { createOpenAIEmbedder, createDefaultEmbedder } from "./embedder";
export type { EmbedderFunction, OpenAIEmbedderConfig } from "./embedder";

// Chunker
export { createLineChunker, createDefaultChunker } from "./chunker";
export type { ChunkerFunction, LineChunkerOptions } from "./chunker";

// Ingest Pipeline
export {
	createIngestPipeline,
	type IngestError,
	type IngestProgress,
	type IngestResult,
} from "./ingest";

// Simplified API with smart defaults
export {
	// Query Service factory
	createQueryService,
	// Types
	type QueryServiceConfig,
} from "./factories";

// Database utilities
export { createColumnMapping } from "./database";

// Enhanced errors (additional classes and utilities)
export {
	// Additional error classes not exported above
	ConfigurationError,
	handleError,
	// Error utilities
	isErrorCategory,
	isErrorCode,
	OperationError,
	// Error types
	type DatabaseErrorCode,
	type EmbeddingErrorCode,
	type OperationErrorCode,
} from "./errors";
