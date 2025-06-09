export interface Document<
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	content: string;
	metadata: TMetadata;
}

export interface DocumentLoaderParams {
	[key: string]: unknown;
}

export interface DocumentLoader<
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	/**
	 * ドキュメントを非同期的にロードする
	 * @param params ローダー固有のパラメータ
	 * @returns Document のAsyncIterable
	 */
	load(params: DocumentLoaderParams): AsyncIterable<Document<TMetadata>>;
}
