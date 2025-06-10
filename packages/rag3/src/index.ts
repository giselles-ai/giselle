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
export { PostgresChunkStore } from "./chunk-store";
export type {
	Chunk,
	ChunkStore,
	ChunkWithEmbedding,
	PostgresChunkStoreConfig,
} from "./chunk-store";

// Query Service
export { PostgresQueryService } from "./query-service";
export type {
	DistanceFunction,
	PostgresQueryServiceConfig,
	QueryResult,
	QueryService,
} from "./query-service";

// Embedder
export { OpenAIEmbedder } from "./embedder";
export type { Embedder, OpenAIEmbedderConfig } from "./embedder";

// Chunker
export { LineChunker } from "./chunker";
export type { Chunker, LineChunkerOptions } from "./chunker";

// Ingest Pipeline
export {
	IngestPipeline,
	type IngestError,
	type IngestPipelineConfig,
	type IngestProgress,
	type IngestResult,
} from "./ingest";

// Schemas
export {
	addTypeDiscriminator,
	// Core schemas
	ChunkSchema,
	ChunkWithEmbeddingSchema,
	// Helper functions
	createColumnMappingFromZod,
	createColumnMappingSchema,
	createDocumentSchema,
	createQueryResultSchema,
	DatabaseConfigSchema,
	RequiredColumnsSchema,
	validateMetadata,
	type CaseConversion,
	type ChunkWithEmbeddingZod,
	// Types
	type ChunkZod,
	type CreateColumnMappingOptions,
	type DatabaseConfigZod,
	type RequiredColumnsZod,
} from "./schemas";

// Simplified API with smart defaults
export {
	// Factory functions
	createChunkStore,
	// Utilities
	createColumnMapping,
	createDefaultChunker,
	// Default instances
	createDefaultEmbedder,
	createIngestPipeline,
	createQueryService,
	DEFAULT_REQUIRED_COLUMNS,
	// Types
	type ChunkStoreConfig,
	type QueryServiceConfig,
} from "./presets";

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
