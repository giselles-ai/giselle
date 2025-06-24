export interface Chunk {
	content: string;
	index: number;
}

export interface ChunkWithEmbedding extends Chunk {
	embedding: number[];
}

export interface ChunkStore<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	/**
	 * Insert chunks into the chunk store
	 * @param documentKey The unique key of the document
	 * @param chunks The chunks with embeddings
	 * @param metadata The document metadata
	 */
	insert(
		documentKey: string,
		chunks: ChunkWithEmbedding[],
		metadata: TMetadata,
	): Promise<void>;

	/**
	 * Delete chunks associated with a document key
	 * @param documentKey The unique key of the document
	 */
	delete(documentKey: string): Promise<void>;

	/**
	 * Delete chunks associated with multiple document keys
	 * @param documentKeys Array of document keys to delete
	 */
	deleteBatch(documentKeys: string[]): Promise<void>;

	/**
	 * Get document versions for differential ingestion
	 * @returns Array of document keys with their versions
	 */
	getDocumentVersions(): Promise<
		Array<{
			documentKey: string;
			version: string;
		}>
	>;
}
