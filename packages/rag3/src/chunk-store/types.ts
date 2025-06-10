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
	deleteByDocumentKey(documentKey: string): Promise<void>;
}
