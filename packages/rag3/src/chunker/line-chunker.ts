import type { Chunker } from "./types";

export interface LineChunkerOptions {
	minChunkSize?: number;
	maxChunkSize?: number;
	overlap?: number;
}

export class LineChunker implements Chunker {
	private options: Required<LineChunkerOptions>;

	constructor(options: LineChunkerOptions = {}) {
		this.options = {
			minChunkSize: 100,
			maxChunkSize: 1000,
			overlap: 50,
			...options,
		};
	}

	chunk(text: string): string[] {
		const lines = text.split("\n");
		const chunks: string[] = [];
		let currentChunk: string[] = [];
		let currentSize = 0;

		for (const line of lines) {
			const lineSize = line.length;

			if (
				currentSize + lineSize > this.options.maxChunkSize &&
				currentChunk.length > 0
			) {
				chunks.push(currentChunk.join("\n"));

				// オーバーラップ処理
				if (this.options.overlap > 0) {
					const overlapLines = this.getOverlapLines(currentChunk);
					currentChunk = overlapLines;
					currentSize = overlapLines.join("\n").length;
				} else {
					currentChunk = [];
					currentSize = 0;
				}
			}

			currentChunk.push(line);
			currentSize += lineSize + 1; // +1 for newline
		}

		// 最後のチャンク
		if (currentChunk.length > 0) {
			const finalChunk = currentChunk.join("\n");
			if (finalChunk.length >= this.options.minChunkSize) {
				chunks.push(finalChunk);
			} else if (chunks.length > 0) {
				// 小さすぎる場合は前のチャンクに結合
				chunks[chunks.length - 1] += `\n${finalChunk}`;
			} else {
				// 唯一のチャンクの場合はそのまま追加
				chunks.push(finalChunk);
			}
		}

		return chunks.filter((chunk) => chunk.trim().length > 0);
	}

	private getOverlapLines(lines: string[]): string[] {
		let overlapSize = 0;
		const overlapLines: string[] = [];

		for (let i = lines.length - 1; i >= 0; i--) {
			if (overlapSize >= this.options.overlap) break;
			overlapLines.unshift(lines[i]);
			overlapSize += lines[i].length;
		}

		return overlapLines;
	}
}
