import type { Chunk } from "../chunk-store/types";

export interface QueryResult<
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	chunk: Chunk;
	similarity: number;
	metadata: TMetadata;
}

export interface QueryService<
	TContext,
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	/**
	 * ベクトル類似検索を実行
	 * @param query 検索クエリ
	 * @param context 検索コンテキスト（フィルタリング用）
	 * @param limit 結果の最大数
	 */
	search(
		query: string,
		context: TContext,
		limit?: number,
	): Promise<QueryResult<TMetadata>[]>;
}
