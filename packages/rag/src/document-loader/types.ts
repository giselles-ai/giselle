/**
 * Document with content and metadata
 */
export interface Document<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	content: string;
	metadata: TMetadata;
}

/**
 * Document loader interface for selective document loading.
 */
export interface DocumentLoader<
	TMetadata extends Record<string, unknown> = Record<string, never>,
	TDocumentKey = string,
> {
	/**
	 * Load metadata for all documents (lightweight operation)
	 * @returns AsyncIterable of metadata
	 */
	loadMetadata(): AsyncIterable<TMetadata>;

	/**
	 * Load a specific document by its key
	 * @param documentKey The key identifying the document
	 * @returns The document with content, or null if not found
	 */
	loadDocument(documentKey: TDocumentKey): Promise<Document<TMetadata> | null>;
}
