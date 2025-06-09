export interface Chunker {
	/**
	 * テキストをチャンクに分割
	 * @param text 分割するテキスト
	 * @returns チャンクの配列
	 */
	chunk(text: string): string[];
}
