export interface Chunk {
	content: string;
	index: number;
}

export interface ChunkWithEmbedding extends Chunk {
	embedding: number[];
}

export interface ChunkStore<
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	/**
	 * チャンクを保存する
	 * @param documentKey ドキュメントの一意キー
	 * @param chunks 埋め込み付きチャンク
	 * @param metadata ドキュメントメタデータ
	 */
	insert(
		documentKey: string,
		chunks: ChunkWithEmbedding[],
		metadata: TMetadata,
	): Promise<void>;

	/**
	 * ドキュメントキーに関連するチャンクを削除
	 * @param documentKey ドキュメントの一意キー
	 */
	deleteByDocumentKey(documentKey: string): Promise<void>;

	/**
	 * リソースをクリーンアップ
	 */
	dispose(): Promise<void>;
}
