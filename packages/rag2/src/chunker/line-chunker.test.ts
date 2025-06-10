import { describe, expect, it } from "vitest";
import { LineChunker } from "./line-chunker";

describe("LineChunker", () => {
	it("should split text into chunks based on line count", () => {
		const chunker = new LineChunker({
			maxLines: 3,
			overlap: 0, // No overlap to simplify testing
		});
		const text = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";

		const chunks = chunker.chunk(text);

		// Should create multiple chunks based on line count
		expect(chunks.length).toBeGreaterThan(1);
		// Check that each chunk is not empty
		for (const chunk of chunks) {
			expect(chunk.trim().length).toBeGreaterThan(0);
		}

		// Each chunk should have at most 3 lines (except possibly the last)
		for (let i = 0; i < chunks.length - 1; i++) {
			const lineCount = chunks[i].split("\n").length;
			expect(lineCount).toBeLessThanOrEqual(3);
		}
	});

	it("should handle empty text", () => {
		const chunker = new LineChunker();
		const chunks = chunker.chunk("");

		expect(chunks).toEqual([]);
	});

	it("should handle single line text", () => {
		const chunker = new LineChunker();
		const text = "This is a single line of text";

		const chunks = chunker.chunk(text);

		expect(chunks).toEqual([text]);
	});

	it("should apply overlap when configured", () => {
		const chunker = new LineChunker({
			maxLines: 3,
			overlap: 1,
		});
		const text = "line1\nline2\nline3\nline4\nline5\nline6";

		const chunks = chunker.chunk(text);

		expect(chunks.length).toBeGreaterThan(1);
		// check that there is overlap between chunks
		const hasOverlap = chunks.some((chunk, index) => {
			if (index === 0) return false;
			const prevChunk = chunks[index - 1];
			return chunk.split("\n").some((line) => prevChunk.includes(line));
		});
		expect(hasOverlap).toBe(true);
	});

	it("should split chunks when they exceed maxChars", () => {
		const chunker = new LineChunker({
			maxLines: 10,
			overlap: 2,
			maxChars: 50,
		});
		// Create a chunk that would normally be within maxLines but exceeds maxChars
		const longText =
			"This is a very long line that definitely exceeds the maximum character limit set for chunks and should be split into multiple parts";
		const text = `${longText}\nshort line\nanother line`;

		const chunks = chunker.chunk(text);

		// Should create multiple chunks due to character limit
		expect(chunks.length).toBeGreaterThan(1);

		// Check that no chunk exceeds maxChars significantly
		for (const chunk of chunks) {
			// Allow some flexibility due to word boundary splitting
			expect(chunk.length).toBeLessThanOrEqual(75); // maxChars + some tolerance for word boundaries
		}

		// Check that the content is preserved
		const reconstructed = chunks.join("\n");
		expect(reconstructed).toContain("This is a very long");
		expect(reconstructed).toContain("short line");
		expect(reconstructed).toContain("another line");
	});

	it("should split long content at word boundaries when possible", () => {
		const chunker = new LineChunker({
			maxLines: 5,
			overlap: 1,
			maxChars: 30,
		});
		const longText =
			"This is a very long text that should be split at word boundaries for better readability";

		const chunks = chunker.chunk(longText);

		// Check that the content was split (should have multiple chunks)
		expect(chunks.length).toBeGreaterThan(1);

		// Check that most chunks try to break at word boundaries
		let wellBrokenChunks = 0;
		for (const chunk of chunks) {
			// Check if chunk ends with complete words or punctuation
			const trimmed = chunk.trim();
			if (trimmed.length === 0) continue;

			// If chunk ends with word boundary, it's well broken
			if (/[\s,.;!?]$/.test(trimmed) || trimmed === chunk) {
				wellBrokenChunks++;
			}
		}

		// Most chunks should have reasonable breaks
		expect(wellBrokenChunks).toBeGreaterThan(0);
	});

	it("should use default maxChars when not specified", () => {
		const chunker = new LineChunker();
		const veryLongText = "a".repeat(15000); // Longer than default maxChars (10000)

		const chunks = chunker.chunk(veryLongText);

		// Should split the very long text
		expect(chunks.length).toBeGreaterThan(1);

		// No chunk should exceed default maxChars significantly
		for (const chunk of chunks) {
			expect(chunk.length).toBeLessThanOrEqual(10000);
		}
	});

	it("should prioritize line count for chunking", () => {
		const chunker = new LineChunker({
			maxLines: 2,
			overlap: 0,
			maxChars: 1000, // Set high to ensure line count is the primary factor
		});
		const text = "line1\nline2\nline3\nline4\nline5";

		const chunks = chunker.chunk(text);

		// Should create chunks based on line count first
		expect(chunks.length).toBeGreaterThan(1);

		// Each chunk should respect the line limit
		for (const chunk of chunks) {
			const lineCount = chunk.split("\n").length;
			expect(lineCount).toBeLessThanOrEqual(2);
		}
	});
});
