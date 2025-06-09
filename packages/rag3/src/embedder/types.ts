export interface Embedder {
	/**
	 * テキストを埋め込みベクトルに変換
	 * @param text 埋め込むテキスト
	 * @returns 埋め込みベクトル
	 */
	embed(text: string): Promise<number[]>;

	/**
	 * 複数のテキストを一度に埋め込む
	 * @param texts 埋め込むテキストの配列
	 * @returns 埋め込みベクトルの配列
	 */
	embedBatch(texts: string[]): Promise<number[][]>;
}
