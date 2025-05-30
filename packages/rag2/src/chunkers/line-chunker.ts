import type { Chunk, Chunker } from "../types";

export interface LineChunkerConfig {
	maxLines?: number;
	overlap?: number;
	maxChars?: number;
}

export class LineChunker implements Chunker {
	private maxLines: number;
	private overlap: number;
	private maxChars: number;

	constructor(config: LineChunkerConfig = {}) {
		this.maxLines = config.maxLines ?? 150;
		this.overlap = config.overlap ?? 30;
		this.maxChars = config.maxChars ?? 10000;
	}

	private hasLongLinesAfterProcessing(content: string): boolean {
		const threshold = this.maxChars * 0.8;
		return content.split("\n").some((line) => line.length > threshold);
	}

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
				if (/\s|[,.;!?]/.test(remaining[i])) {
					breakPoint = i + 1;
					break;
				}
			}

			chunks.push(remaining.slice(0, breakPoint).trim());
			remaining = remaining.slice(breakPoint).trim();
		}

		return chunks;
	}

	*chunk(content: string): Generator<Chunk, void, unknown> {
		const lines = content.split("\n");
		let chunkIndex = 0;

		for (let i = 0; i < lines.length; i += this.maxLines - this.overlap) {
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
				for (const splitChunk of splitChunks) {
					yield {
						content: splitChunk,
						index: chunkIndex++,
					};
				}
			} else {
				yield {
					content: chunkContent,
					index: chunkIndex++,
				};
			}

			// If we've reached the end, break
			if (endIndex >= lines.length) {
				break;
			}
		}
	}
}

export function createLineChunker(config?: LineChunkerConfig): LineChunker {
	return new LineChunker(config);
}
