/**
 * RAG2 default settings and utilities
 */

// Re-export types
export type {
	ChunkStoreConfig,
	QueryServiceConfig,
	IngestPipelineConfig,
} from "./types";

// Re-export constants and utilities
export {
	createColumnMapping,
	createDefaultChunker,
	createDefaultEmbedder,
} from "./utils";

// Re-export factory functions
export {
	createChunkStore,
	createIngestPipeline,
	createQueryService,
} from "./factories";
