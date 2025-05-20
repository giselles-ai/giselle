import type { ChunkResult, Chunker } from "./types";

/**
 * LineChunker splits content into chunks based on line count
 */
export class LineChunker implements Chunker {
	private maxLines: number;
	private overlap: number;

	constructor(maxLines = 150, overlap = 30) {
		this.maxLines = maxLines;
		this.overlap = overlap;
	}

	/**
	 * Split document string into chunks by lines
	 * @param content - document string
	 */
	async *chunk(content: string): AsyncGenerator<ChunkResult, void, unknown> {
		const lines = content.split(/\r?\n/);
		let chunkIndex = 0;

		for (let i = 0; i < lines.length; i += this.maxLines - this.overlap) {
			yield {
				content: lines.slice(i, i + this.maxLines).join("\n"),
				index: chunkIndex,
			};
			chunkIndex++;
		}
	}
}

/**
 * Helper function to create a LineChunker with default settings
 */
export function createLineChunker(maxLines = 150, overlap = 30): Chunker {
	return new LineChunker(maxLines, overlap);
}
