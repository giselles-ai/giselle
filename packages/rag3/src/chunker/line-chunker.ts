import type { Chunker } from "./types";

export interface LineChunkerOptions {
	/**
	 * Maximum number of lines per chunk
	 * Default: 150
	 */
	maxLines?: number;
	/**
	 * Number of lines to overlap between chunks
	 * Default: 30
	 */
	overlap?: number;
	/**
	 * Maximum characters per chunk before splitting
	 * Default: 10000
	 */
	maxChars?: number;
}

export class LineChunker implements Chunker {
	private maxLines: number;
	private overlap: number;
	private maxChars: number;

	constructor(options: LineChunkerOptions = {}) {
		this.maxLines = options.maxLines ?? 150;
		this.overlap = options.overlap ?? 30;
		this.maxChars = options.maxChars ?? 10000;
	}

	chunk(text: string): string[] {
		const lines = text.split("\n");
		const chunks: string[] = [];

		// Ensure we make progress even with large overlaps
		const step = Math.max(1, this.maxLines - this.overlap);

		for (let i = 0; i < lines.length; i += step) {
			const endIndex = Math.min(i + this.maxLines, lines.length);
			const chunkLines = lines.slice(i, endIndex);
			const chunkContent = chunkLines.join("\n").trim();

			if (chunkContent.length === 0) {
				continue;
			}

			// Check if content exceeds character limit or has long lines
			if (
				chunkContent.length > this.maxChars ||
				this.hasLongLinesAfterProcessing(chunkContent)
			) {
				// Split content that exceeds character limits
				const splitChunks = this.splitLongContent(chunkContent);
				chunks.push(...splitChunks);
			} else {
				chunks.push(chunkContent);
			}

			// If we've reached the end, break
			if (endIndex >= lines.length) {
				break;
			}
		}

		return chunks.filter((chunk) => chunk.trim().length > 0);
	}

	/**
	 * Check if content has long lines after processing
	 */
	private hasLongLinesAfterProcessing(content: string): boolean {
		const threshold = this.maxChars * 0.8;
		return content.split("\n").some((line) => line.length > threshold);
	}

	/**
	 * Split long content into smaller chunks
	 */
	private splitLongContent(content: string): string[] {
		if (content.length <= this.maxChars) {
			return [content];
		}

		const chunks: string[] = [];
		let remaining = content;

		while (remaining.length > 0) {
			if (remaining.length <= this.maxChars) {
				chunks.push(remaining);
				break;
			}

			// Try to find a good break point (space, punctuation)
			let breakPoint = this.maxChars;
			for (let i = this.maxChars - 1; i > this.maxChars * 0.8; i--) {
				if (i < remaining.length && /\s|[,.;!?]/.test(remaining[i])) {
					breakPoint = i + 1;
					break;
				}
			}

			// Ensure we make progress (avoid infinite loop)
			if (breakPoint === 0) {
				breakPoint = Math.max(1, this.maxChars);
			}

			const chunk = remaining.slice(0, breakPoint).trim();
			if (chunk.length > 0) {
				chunks.push(chunk);
			}

			remaining = remaining.slice(breakPoint).trim();

			// Safety check to prevent infinite loop
			if (remaining === content || breakPoint === 0) {
				if (remaining.length > 0) {
					chunks.push(remaining);
				}
				break;
			}
		}

		return chunks;
	}
}
