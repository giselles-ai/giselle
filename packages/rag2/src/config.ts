// Configuration types and defaults

// Physical column configuration (database layer)
export interface ColumnConfiguration {
	readonly chunkContent: string;
	readonly chunkIndex: string;
	readonly embedding: string;
}

// Default column configuration
export const DEFAULT_COLUMN_CONFIG: ColumnConfiguration = {
	chunkContent: "chunk_content",
	chunkIndex: "chunk_index",
	embedding: "embedding",
} as const;

// Embedder configuration
export interface EmbedderConfig {
	provider?: "openai";
	model?: string;
}
