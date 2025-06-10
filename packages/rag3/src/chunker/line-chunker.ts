import { z } from "zod/v4";
import { ConfigurationError } from "../errors";
import type { Chunker } from "./types";

/**
 * Constants for line chunker behavior
 */
const CHUNKER_CONSTANTS = {
	/**
	 * Threshold ratio for detecting long lines (relative to maxChars)
	 * Used to identify lines that might need special handling
	 */
	LONG_LINE_THRESHOLD_RATIO: 0.8,

	/**
	 * Minimum step size to ensure progress when chunking
	 * Prevents infinite loops when overlap is too large
	 */
	MIN_STEP_SIZE: 1,

	/**
	 * Word boundary patterns for intelligent text splitting
	 * Prioritizes breaking at natural language boundaries
	 */
	WORD_BOUNDARY_PATTERN: /\s|[,.;!?]/,

	/**
	 * Minimum break point to avoid creating empty chunks
	 */
	MIN_BREAK_POINT: 1,
} as const;

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

	chunk(text: string): string[] {
		const lines = text.split("\n");
		const chunks: string[] = [];

		// Ensure we make progress even with large overlaps
		const step = Math.max(
			CHUNKER_CONSTANTS.MIN_STEP_SIZE,
			this.maxLines - this.overlap,
		);

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
		const threshold =
			this.maxChars * CHUNKER_CONSTANTS.LONG_LINE_THRESHOLD_RATIO;
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
			const minBreakPoint =
				this.maxChars * CHUNKER_CONSTANTS.LONG_LINE_THRESHOLD_RATIO;

			for (let i = this.maxChars - 1; i > minBreakPoint; i--) {
				if (
					i < remaining.length &&
					CHUNKER_CONSTANTS.WORD_BOUNDARY_PATTERN.test(remaining[i])
				) {
					breakPoint = i + 1;
					break;
				}
			}

			// Ensure we make progress (avoid infinite loop)
			if (breakPoint === 0) {
				breakPoint = Math.max(CHUNKER_CONSTANTS.MIN_BREAK_POINT, this.maxChars);
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
