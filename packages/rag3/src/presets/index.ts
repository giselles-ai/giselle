/**
 * RAG3 default settings and utilities
 */

// Re-export types
export type {
	ChunkStoreConfig,
	QueryServiceConfig,
	SimpleIngestConfig,
} from "./types";

// Re-export constants and utilities
export {
	createColumnMapping,
	createDefaultChunker,
	createDefaultEmbedder,
	DEFAULT_REQUIRED_COLUMNS,
} from "./utils";

// Re-export factory functions
export {
	createChunkStore,
	createIngestPipeline,
	createQueryService,
} from "./factories";
