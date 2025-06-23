import type { ChunkerFunction } from "./types";

export interface LineChunkerOptions {
	maxLines: number;
	overlap: number;
	maxChars: number;
}

enum ShrinkMode {
	OVERLAP_REDUCTION = "overlap_reduction",
	LINE_REDUCTION = "line_reduction",
	CHARACTER_SPLIT = "character_split",
}

interface ChunkInfo {
	startIndex: number;
	endIndex: number;
	content: string;
	currentOverlap: number;
	lines: string[];
}

/**
 * Create a line chunker function with the specified options
 * @param options Configuration options for the chunker
 * @returns A function that chunks text based on lines
 */
export function createLineChunker(
	options: LineChunkerOptions,
): ChunkerFunction {
	const { maxLines, overlap, maxChars } = options;

	if (maxLines < 1) {
		throw new Error("maxLines must be at least 1");
	}
	if (overlap < 0) {
		throw new Error("overlap cannot be negative");
	}
	if (overlap >= maxLines) {
		throw new Error("overlap must be less than maxLines");
	}
	if (maxChars < 1) {
		throw new Error("maxChars must be at least 1");
	}

	/**
	 * Split text into chunks based on lines with overlap
	 */
	return function chunk(text: string): string[] {
		const lines = text.split("\n");
		const chunks: string[] = [];

		let i = 0;
		let skipNextOverlap = false;

		while (i < lines.length) {
			const isFirstChunk = chunks.length === 0;
			const shouldOverlap = shouldUseOverlap(isFirstChunk, skipNextOverlap);
			skipNextOverlap = false;
			const initialOverlap = shouldOverlap ? overlap : 0;

			let chunkInfo = createInitialChunk(i, lines, initialOverlap, maxLines);

			// Shrink loop: reduce chunk size until it fits maxChars
			let characterSplit = false;
			while (chunkInfo.content.length > maxChars) {
				const shrinkMode = getShrinkMode(chunkInfo);
				let reduced: ChunkInfo | null = null;

				switch (shrinkMode) {
					case ShrinkMode.OVERLAP_REDUCTION:
						reduced = reduceOverlapGradually(chunkInfo, lines);
						break;
					case ShrinkMode.LINE_REDUCTION:
						reduced = reduceLineCountGradually(chunkInfo, lines);
						break;
					case ShrinkMode.CHARACTER_SPLIT: {
						const splitChunks = splitLongContent(chunkInfo.content, maxChars);
						chunks.push(...splitChunks);
						skipNextOverlap = true;
						i = chunkInfo.endIndex;
						characterSplit = true;
						break;
					}
				}

				if (reduced === null || characterSplit) {
					break;
				}
				chunkInfo = reduced;
			}

			// If we have done character splitting, adding the chunks is already done
			// and we can skip the overlap calculation
			if (!characterSplit) {
				if (chunkInfo.content.length > 0) {
					chunks.push(chunkInfo.content);
				}
				i = nextStartIndex(chunkInfo, skipNextOverlap, lines.length, overlap);
			}
		}

		return chunks.filter((chunk) => chunk.length > 0);
	};
}

function getShrinkMode(chunkInfo: ChunkInfo): ShrinkMode {
	if (chunkInfo.currentOverlap > 0) {
		return ShrinkMode.OVERLAP_REDUCTION;
	}
	const currentLineCount = chunkInfo.endIndex - chunkInfo.startIndex;
	if (currentLineCount > 1) {
		return ShrinkMode.LINE_REDUCTION;
	}
	return ShrinkMode.CHARACTER_SPLIT;
}

function shouldUseOverlap(
	isFirstChunk: boolean,
	skipNextOverlap: boolean,
): boolean {
	return !isFirstChunk && !skipNextOverlap;
}

function nextStartIndex(
	chunkInfo: ChunkInfo,
	skipNextOverlap: boolean,
	totalLines: number,
	overlap: number,
): number {
	if (chunkInfo.endIndex >= totalLines) {
		return chunkInfo.endIndex;
	}

	const overlapAmount = skipNextOverlap ? 0 : overlap;
	const nextStart = chunkInfo.endIndex - overlapAmount;

	return Math.max(nextStart, chunkInfo.startIndex + 1);
}

function buildChunk(
	startIndex: number,
	endIndex: number,
	lines: string[],
	currentOverlap: number,
): ChunkInfo {
	const chunkLines = lines.slice(startIndex, endIndex);
	const content = chunkLines.join("\n");

	return {
		startIndex,
		endIndex,
		content,
		currentOverlap,
		lines: chunkLines,
	};
}

function createInitialChunk(
	startIndex: number,
	lines: string[],
	initialOverlap: number,
	maxLines: number,
): ChunkInfo {
	const endIndex = Math.min(startIndex + maxLines, lines.length);
	return buildChunk(startIndex, endIndex, lines, initialOverlap);
}

function reduceOverlapGradually(
	chunkInfo: ChunkInfo,
	lines: string[],
): ChunkInfo | null {
	if (chunkInfo.currentOverlap === 0) {
		return null;
	}
	const newOverlap = Math.floor(chunkInfo.currentOverlap / 2);
	const overlapReduction = chunkInfo.currentOverlap - newOverlap;
	const newStartIndex = chunkInfo.startIndex + overlapReduction;

	// Keep the same end position to maintain fixed end boundary
	const newEndIndex = chunkInfo.endIndex;

	return buildChunk(newStartIndex, newEndIndex, lines, newOverlap);
}

function reduceLineCountGradually(
	chunkInfo: ChunkInfo,
	lines: string[],
): ChunkInfo | null {
	const currentLineCount = chunkInfo.endIndex - chunkInfo.startIndex;
	if (currentLineCount <= 1) {
		return null;
	}

	const newEndIndex = chunkInfo.endIndex - 1;

	return buildChunk(
		chunkInfo.startIndex,
		newEndIndex,
		lines,
		chunkInfo.currentOverlap,
	);
}

function splitLongContent(content: string, maxChars: number): string[] {
	return Array.from({ length: Math.ceil(content.length / maxChars) }, (_, k) =>
		content.slice(k * maxChars, (k + 1) * maxChars),
	).filter((chunk) => chunk.length > 0);
}
