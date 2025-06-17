import { z } from "zod/v4";
import { ConfigurationError } from "../errors";
import type { Chunker } from "./types";

const LineChunkerOptionsSchema = z
	.object({
		/**
		 * Maximum number of lines per chunk
		 * Default: 150
		 */
		maxLines: z
			.number()
			.int()
			.positive("maxLines must be positive")
			.max(1000, "maxLines cannot exceed 1000")
			.optional()
			.default(150),
		/**
		 * Number of lines to overlap between chunks
		 * Default: 30
		 */
		overlap: z
			.number()
			.int()
			.nonnegative("overlap must be non-negative")
			.optional()
			.default(30),
		/**
		 * Maximum characters per chunk before splitting
		 * Default: 10000
		 */
		maxChars: z
			.number()
			.int()
			.positive("maxChars must be positive")
			.max(100000, "maxChars cannot exceed 100000")
			.optional()
			.default(10000),
	})
	.refine((data) => data.overlap < data.maxLines, {
		message: "overlap must be less than maxLines",
		path: ["overlap"],
	});
export type LineChunkerOptions = z.input<typeof LineChunkerOptionsSchema>;

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

export class LineChunker implements Chunker {
	private maxLines: number;
	private overlap: number;
	private maxChars: number;

	constructor(options: LineChunkerOptions = {}) {
		// Validate configuration with Zod
		const validationResult = LineChunkerOptionsSchema.safeParse(options);
		if (!validationResult.success) {
			throw ConfigurationError.invalidValue(
				"LineChunkerOptions",
				options,
				"Valid chunker configuration",
				{
					operation: "constructor",
					validationErrors: validationResult.error.issues,
				},
			);
		}

		// Use validated and defaulted values
		const validatedOptions = validationResult.data;
		this.maxLines = validatedOptions.maxLines;
		this.overlap = validatedOptions.overlap;
		this.maxChars = validatedOptions.maxChars;
	}

	/**
	 * Split text into chunks based on lines with gradual overlap reduction strategy
	 *
	 * Flow:
	 * 1. Start: i = 0, wasLineSplit = false
	 * 2. While i < lines.length:
	 *    a. Create chunk: currentOverlap = (isFirstChunk || wasLineSplit) ? 0 : overlapSetting
	 *    b. Reset wasLineSplit = false
	 *    c. Check if content exceeds maxChars:
	 *       - If No: Confirm chunk
	 *       - If Yes: Check if currentOverlap > 0:
	 *         - If Yes: Gradual overlap reduction (overlap = floor(overlap/2), adjust start position)
	 *         - If No: Check if lineCount > 1:
	 *           - If Yes: Gradual line reduction (end = end - 1)
	 *           - If No: Character split execution, set wasLineSplit = true, i = end
	 *    d. Add chunk and calculate next position: i = start + actualChunkSize - effectiveOverlap
	 * 3. Return chunks (filter empty)
	 */
	chunk(text: string): string[] {
		const lines = text.split("\n");
		const chunks: string[] = [];

		let i = 0;
		let wasLineSplit = false;

		while (i < lines.length) {
			const isFirstChunk = chunks.length === 0;
			const shouldOverlap = this.shouldUseOverlap(isFirstChunk, wasLineSplit);
			const initialOverlap = shouldOverlap ? this.overlap : 0;

			// Create initial chunk
			let chunkInfo = this.createInitialChunk(i, lines, initialOverlap);

			// Reset wasLineSplit for each chunk
			wasLineSplit = false;

			// Shrinking loop: reduce chunk size until it fits maxChars
			let characterSplit = false;
			while (chunkInfo.content.length > this.maxChars) {
				const shrinkMode = this.getShrinkMode(chunkInfo);
				let reduced: ChunkInfo | null = null;

				switch (shrinkMode) {
					case ShrinkMode.OVERLAP_REDUCTION:
						reduced = this.reduceOverlapGradually(chunkInfo, lines);
						break;
					case ShrinkMode.LINE_REDUCTION:
						reduced = this.reduceLineCountGradually(chunkInfo, lines);
						break;
					case ShrinkMode.CHARACTER_SPLIT: {
						const splitChunks = this.splitLongContent(chunkInfo.content);
						chunks.push(...splitChunks);
						wasLineSplit = true;
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

			// Only process normal chunk if we didn't do character splitting
			if (!characterSplit) {
				if (chunkInfo.content.length > 0) {
					chunks.push(chunkInfo.content);
				}
				i = this.nextStartIndex(chunkInfo, wasLineSplit, lines.length);
			}
		}

		return chunks.filter((chunk) => chunk.trim().length > 0);
	}

	/**
	 * Determine the appropriate shrink mode for a chunk that exceeds maxChars
	 */
	private getShrinkMode(chunkInfo: ChunkInfo): ShrinkMode {
		if (chunkInfo.currentOverlap > 0) {
			return ShrinkMode.OVERLAP_REDUCTION;
		}
		const currentLineCount = chunkInfo.endIndex - chunkInfo.startIndex;
		if (currentLineCount > 1) {
			return ShrinkMode.LINE_REDUCTION;
		}
		return ShrinkMode.CHARACTER_SPLIT;
	}

	/**
	 * Determine if overlap should be used for the current chunk
	 */
	private shouldUseOverlap(
		isFirstChunk: boolean,
		wasLineSplit: boolean,
	): boolean {
		return !isFirstChunk && !wasLineSplit;
	}

	/**
	 * Calculate next starting position based on chunk info and line split status
	 */
	private nextStartIndex(
		chunkInfo: ChunkInfo,
		wasLineSplit: boolean,
		totalLines: number,
	): number {
		const actualChunkSize = chunkInfo.endIndex - chunkInfo.startIndex;
		const effectiveOverlap = wasLineSplit ? 0 : this.overlap;
		const nextPosition =
			chunkInfo.startIndex + actualChunkSize - effectiveOverlap;

		// If we've processed all lines, return the end index to terminate the loop
		if (chunkInfo.endIndex >= totalLines) {
			return chunkInfo.endIndex;
		}

		// Ensure progress by advancing at least 1 position
		return Math.max(nextPosition, chunkInfo.startIndex + 1);
	}

	/**
	 * Build chunk information from boundary indices
	 */
	private buildChunk(
		startIndex: number,
		endIndex: number,
		lines: string[],
		currentOverlap: number,
	): ChunkInfo {
		const chunkLines = lines.slice(startIndex, endIndex);
		const content = chunkLines.join("\n").trim();

		return {
			startIndex,
			endIndex,
			content,
			currentOverlap,
			lines: chunkLines,
		};
	}

	/**
	 * Create initial chunk information
	 */
	private createInitialChunk(
		startIndex: number,
		lines: string[],
		initialOverlap: number,
	): ChunkInfo {
		const endIndex = Math.min(startIndex + this.maxLines, lines.length);
		return this.buildChunk(startIndex, endIndex, lines, initialOverlap);
	}

	/**
	 * Reduce overlap gradually and adjust chunk accordingly
	 * Returns null if overlap cannot be reduced further (already 0)
	 */
	private reduceOverlapGradually(
		chunkInfo: ChunkInfo,
		lines: string[],
	): ChunkInfo | null {
		if (chunkInfo.currentOverlap === 0) {
			return null;
		}

		// Reduce overlap by half (rounded down)
		const newOverlap = Math.floor(chunkInfo.currentOverlap / 2);

		// Calculate how many lines we're reducing the overlap by
		const overlapReduction = chunkInfo.currentOverlap - newOverlap;

		// Adjust start position forward by the overlap reduction
		const newStartIndex = chunkInfo.startIndex + overlapReduction;

		// Keep the same end position to maintain fixed end boundary
		const newEndIndex = chunkInfo.endIndex;

		return this.buildChunk(newStartIndex, newEndIndex, lines, newOverlap);
	}

	/**
	 * Reduce line count gradually when overlap reduction is not sufficient
	 * Returns null if only one line remains (cannot reduce further)
	 */
	private reduceLineCountGradually(
		chunkInfo: ChunkInfo,
		lines: string[],
	): ChunkInfo | null {
		const currentLineCount = chunkInfo.endIndex - chunkInfo.startIndex;

		if (currentLineCount <= 1) {
			return null;
		}

		// Reduce by one line from the end
		const newEndIndex = chunkInfo.endIndex - 1;

		return this.buildChunk(
			chunkInfo.startIndex,
			newEndIndex,
			lines,
			chunkInfo.currentOverlap,
		);
	}

	/**
	 * Split long content into smaller chunks
	 * This is only used for single lines that exceed maxChars
	 */
	private splitLongContent(content: string): string[] {
		return Array.from(
			{ length: Math.ceil(content.length / this.maxChars) },
			(_, k) =>
				content.slice(k * this.maxChars, (k + 1) * this.maxChars).trim(),
		).filter(Boolean);
	}
}
