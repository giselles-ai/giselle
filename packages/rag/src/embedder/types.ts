/**
 * Metrics collected after embedding completion
 */
export interface EmbeddingMetrics {
	texts: string[];
	embeddings: number[][];
	model: string;
	provider: "openai" | "google" | "cohere";
	dimensions: number;
	usage?: { tokens: number };
	operation: "embed" | "embedMany";
	startTime: Date;
	endTime: Date;
}

/**
 * Callback function invoked when embedding is complete
 */
export type EmbeddingCompleteCallback = (
	metrics: EmbeddingMetrics,
) => void | Promise<void>;

/**
 * Function type for embedding operations
 */
export type EmbedderFunction = {
	/**
	 * Convert text to an embedding vector
	 * @param text The text to embed
	 * @returns The embedding vector
	 */
	embed(text: string): Promise<number[]>;

	/**
	 * Embed multiple texts at once
	 * @param texts The array of texts to embed
	 * @returns The array of embedding vectors
	 */
	embedMany(texts: string[]): Promise<number[][]>;

	/**
	 * Optional callback invoked after embedding completion
	 */
	embeddingComplete?: EmbeddingCompleteCallback;
};
