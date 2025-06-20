export interface Document<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	content: string;
	metadata: TMetadata;
}

export interface DocumentLoaderParams {
	[key: string]: unknown;
}

export interface DocumentLoader<
	TMetadata extends Record<string, unknown> = Record<string, never>,
	TParams extends DocumentLoaderParams = DocumentLoaderParams,
> {
	/**
	 * Load documents asynchronously
	 * @param params loader-specific parameters
	 * @returns AsyncIterable of Document
	 */
	load(params: TParams): AsyncIterable<Document<TMetadata>>;
}
