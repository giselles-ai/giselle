export interface Chunker {
	/**
	 * Split text into chunks
	 * @param text The text to split
	 * @returns The array of chunks
	 */
	chunk(text: string): string[];
}
