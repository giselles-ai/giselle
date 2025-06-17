export interface Embedder {
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
}
