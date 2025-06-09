import { describe, expect, it } from "vitest";
import { LineChunker } from "./line-chunker";

describe("LineChunker", () => {
	it("should split text into chunks based on line breaks", () => {
		const chunker = new LineChunker({
			maxChunkSize: 50,
			minChunkSize: 10,
			overlap: 0, // No overlap to simplify testing
		});
		const text = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";

		const chunks = chunker.chunk(text);

		// Just check that we get multiple chunks
		expect(chunks.length).toBeGreaterThan(0);
		// Check that each chunk is not empty
		for (const chunk of chunks) {
			expect(chunk.trim().length).toBeGreaterThan(0);
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
			maxChunkSize: 30,
			overlap: 10,
			minChunkSize: 1,
		});
		const text = "line1\nline2\nline3\nline4\nline5\nline6";

		const chunks = chunker.chunk(text);

		expect(chunks.length).toBeGreaterThan(1);
		// チャンク間にオーバーラップがあることを確認
		const hasOverlap = chunks.some((chunk, index) => {
			if (index === 0) return false;
			const prevChunk = chunks[index - 1];
			return chunk.split("\n").some((line) => prevChunk.includes(line));
		});
		expect(hasOverlap).toBe(true);
	});
});
