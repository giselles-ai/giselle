export interface Document<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	content: string;
	metadata: TMetadata;
}

export interface DocumentLoader<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	/**
	 * Load metadata for all documents (lightweight operation)
	 * @returns AsyncIterable of metadata
	 */
	loadMetadata(): AsyncIterable<TMetadata>;

	/**
	 * Load a specific document by its metadata
	 * @param metadata The metadata identifying the document
	 * @returns The document with content, or null if not found
	 */
	loadDocument(metadata: TMetadata): Promise<Document<TMetadata> | null>;
}
