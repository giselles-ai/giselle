// Core data types
export * from "./types";

// Configuration
export * from "./config";

// Error types
export * from "./errors";

// Document type definition API
export {
	defineStorageSchema,
	type ChunkOf,
	type MetadataOf,
	type StorageSchemaConfig,
} from "./storage-schema";

// Internal utilities (used by document-type, exported for advanced use cases)
export type { MetadataDefinitionResult } from "./metadata";

// Service interfaces
export * from "./stores/interfaces";

// Implementations
export { createLineChunker } from "./chunkers/line-chunker";
export { createOpenAIEmbedder } from "./embedders/openai-embedder";
export { createIngestionPipeline } from "./pipelines/ingestion-pipeline";
// PostgreSQL implementations
export {
	createDocumentChunkStore,
	DocumentChunkStore,
} from "./stores/postgres/chunk-store";
export {
	createPostgresQueryService,
	PostgresQueryService,
} from "./stores/postgres/query-service";

// GitHub-specific exports (used with defineStorageSchema)
export {
	GitHubBlobLoader,
	type GitHubLoaderOptions,
} from "./github/loaders/github-loader";
export {
	GitHubBlobSource,
	GitHubBlobSourceType,
	type GitHubBlobBasicMetadata,
} from "./github/types";
