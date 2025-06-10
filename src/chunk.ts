import type { ChunkResult, Chunker } from "./types";

export interface LineChunkerOptions {
	/**
	 * Maximum number of lines per chunk
	 */
	maxLines?: number;
	/**
	 * Maximum number of characters per chunk
	 */
	maxChunkSize?: number;
	/**
	 * Number of lines to overlap between chunks
	 */
	overlap?: number;
	/**
	 * Minimum chunk size to prevent very small chunks
	 */
	minChunkSize?: number;
}

/**
 * Default maximum lines per chunk
 */
const DEFAULT_MAX_LINES = 150;

/**
 * Default number of overlapping lines between chunks
 */
const DEFAULT_OVERLAP = 30;

/**
 * Default maximum characters per chunk, based on embedding API token limits:
 * - Embedding APIs typically support up to 8,192 tokens
 * - Using 10,000 characters provides a safety margin for token conversion
 * - Ensures chunks stay within API limits while maximizing content per chunk
 */
const DEFAULT_MAX_CHUNK_SIZE = 10000;

/**
 * Default minimum chunk size to prevent very small chunks
 */
const DEFAULT_MIN_CHUNK_SIZE = 100;

/**
 * LineChunker splits content into chunks based on line count with character limits.
 * Provides overlap between chunks to maintain context across chunk boundaries.
 */
export class LineChunker implements Chunker {
	private options: Required<LineChunkerOptions>;

	constructor(options: LineChunkerOptions = {}) {
		this.options = {
			maxLines: options.maxLines ?? DEFAULT_MAX_LINES,
			maxChunkSize: options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE,
			overlap: options.overlap ?? DEFAULT_OVERLAP,
			minChunkSize: options.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE,
		};

		this.validateOptions();
	}

	private validateOptions(): void {
		if (this.options.maxLines <= 0) {
			throw new Error(
				`Invalid value for maxLines: ${this.options.maxLines}. Must be positive.`,
			);
		}
		if (this.options.maxChunkSize <= 0) {
			throw new Error(
				`Invalid value for maxChunkSize: ${this.options.maxChunkSize}. Must be positive.`,
			);
		}
		if (this.options.overlap < 0) {
			throw new Error(
				`Invalid value for overlap: ${this.options.overlap}. Must be non-negative.`,
			);
		}
		if (this.options.minChunkSize < 0) {
			throw new Error(
				`Invalid value for minChunkSize: ${this.options.minChunkSize}. Must be non-negative.`,
			);
		}
		if (this.options.overlap >= this.options.maxLines) {
			throw new Error(
				`Invalid configuration: overlap (${this.options.overlap}) must be less than maxLines (${this.options.maxLines}).`,
			);
		}
	}

	/**
	 * Split document string into chunks by lines with character limit enforcement
	 * @param content - document string to be chunked
	 */
	async *chunk(content: string): AsyncGenerator<ChunkResult, void, unknown> {
		const lines = content.split(/\r?\n/);
		let chunkIndex = 0;
		let currentLines: string[] = [];
		let currentSize = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineSize = line.length + 1; // +1 for newline character

			// Check if adding this line would exceed limits
			if (
				(currentLines.length >= this.options.maxLines ||
					currentSize + lineSize > this.options.maxChunkSize) &&
				currentLines.length > 0
			) {
				// Create chunk from current lines
				const chunkContent = currentLines.join("\n");

				// If chunk is too large, split by character limit
				if (chunkContent.length > this.options.maxChunkSize) {
					yield* this.splitByCharacterLimit(chunkContent, chunkIndex);
					chunkIndex += Math.ceil(
						chunkContent.length / this.options.maxChunkSize,
					);
				} else if (chunkContent.trim().length >= this.options.minChunkSize) {
					yield this.createChunk(chunkContent, chunkIndex++);
				}

				// Handle overlap
				if (
					this.options.overlap > 0 &&
					currentLines.length > this.options.overlap
				) {
					const overlapLines = currentLines.slice(-this.options.overlap);
					currentLines = overlapLines;
					currentSize = overlapLines.join("\n").length;
				} else {
					currentLines = [];
					currentSize = 0;
				}
			}

			// Add current line
			currentLines.push(line);
			currentSize += lineSize;
		}

		// Handle final chunk
		if (currentLines.length > 0) {
			const finalChunk = currentLines.join("\n");

			if (finalChunk.length > this.options.maxChunkSize) {
				yield* this.splitByCharacterLimit(finalChunk, chunkIndex);
			} else if (
				finalChunk.trim().length >= this.options.minChunkSize ||
				chunkIndex === 0
			) {
				// Always include the final chunk if it's the only chunk (even if below minChunkSize)
				yield this.createChunk(finalChunk, chunkIndex);
			}
		}
	}

	/**
	 * Split content by character limit when it exceeds maxChunkSize
	 */
	private async *splitByCharacterLimit(
		content: string,
		startIndex: number,
	): AsyncGenerator<ChunkResult, void, unknown> {
		let index = startIndex;

		for (let i = 0; i < content.length; i += this.options.maxChunkSize) {
			const chunk = content.substring(i, i + this.options.maxChunkSize);
			yield this.createChunk(chunk, index++);
		}
	}

	/**
	 * Create a chunk result object
	 */
	private createChunk(content: string, index: number): ChunkResult {
		return {
			content: content.trim(),
			index,
		};
	}
}

/**
 * Helper function to create a LineChunker with default settings
 * @param options - Chunker configuration options
 */
export function createLineChunker(options: LineChunkerOptions = {}): Chunker {
	return new LineChunker(options);
}
