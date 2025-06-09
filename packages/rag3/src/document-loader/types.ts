export interface Document<TMetadata = Record<string, unknown>> {
	content: string;
	metadata: TMetadata;
}

export interface DocumentLoaderParams {
	[key: string]: unknown;
}

export interface DocumentLoader<TMetadata = Record<string, unknown>> {
	/**
	 * ドキュメントを非同期的にロードする
	 * @param params ローダー固有のパラメータ
	 * @returns Document のAsyncIterable
	 */
	load(params: DocumentLoaderParams): AsyncIterable<Document<TMetadata>>;
}
