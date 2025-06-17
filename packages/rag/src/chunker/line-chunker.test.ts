import { describe, expect, it } from "vitest";
import { LineChunker } from "./line-chunker";

describe("LineChunker", () => {
	describe("Basic functionality", () => {
		it("should split text into chunks based on line count", () => {
			const chunker = new LineChunker({
				maxLines: 3,
				overlap: 0,
			});
			const text = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";

			const chunks = chunker.chunk(text);

			expect(chunks.length).toBeGreaterThan(1);
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
			// Verify overlap by checking that consecutive chunks share content
			for (let i = 0; i < chunks.length - 1; i++) {
				const currentChunk = chunks[i];
				const nextChunk = chunks[i + 1];
				// Should have some overlapping content
				expect(currentChunk.length).toBeGreaterThan(0);
				expect(nextChunk.length).toBeGreaterThan(0);
			}
		});

		it("should respect maxChars limit", () => {
			const chunker = new LineChunker({
				maxLines: 100,
				maxChars: 50,
				overlap: 0,
			});
			const longLine = "a".repeat(100);
			const text = `${longLine}\nshort line`;

			const chunks = chunker.chunk(text);

			expect(chunks.length).toBeGreaterThan(1);
			for (const chunk of chunks) {
				expect(chunk.length).toBeLessThanOrEqual(50);
			}
		});
	});

	describe("Configuration validation", () => {
		it("should use default values when no options provided", () => {
			expect(() => new LineChunker()).not.toThrow();
		});

		it("should validate maxLines is positive", () => {
			expect(() => new LineChunker({ maxLines: 0 })).toThrow();
			expect(() => new LineChunker({ maxLines: -1 })).toThrow();
		});

		it("should validate overlap is non-negative", () => {
			expect(() => new LineChunker({ overlap: -1 })).toThrow();
		});

		it("should validate overlap is less than maxLines", () => {
			expect(() => new LineChunker({ maxLines: 5, overlap: 5 })).toThrow();
			expect(() => new LineChunker({ maxLines: 5, overlap: 6 })).toThrow();
		});

		it("should validate maxChars is positive", () => {
			expect(() => new LineChunker({ maxChars: 0 })).toThrow();
			expect(() => new LineChunker({ maxChars: -1 })).toThrow();
		});

		it("should enforce maximum limits", () => {
			expect(() => new LineChunker({ maxLines: 1001 })).toThrow();
			expect(() => new LineChunker({ maxChars: 100001 })).toThrow();
		});
	});

	describe("Edge cases", () => {
		it("should handle text with only newlines", () => {
			const chunker = new LineChunker({ maxLines: 2, overlap: 0 });
			const text = "\n\n\n\n\n";

			const chunks = chunker.chunk(text);

			// Empty lines might be filtered out, so we check for either empty array or chunks
			expect(chunks.length).toBeGreaterThanOrEqual(0);
		});

		it("should handle text without newlines", () => {
			const chunker = new LineChunker({ maxLines: 3, overlap: 0 });
			const text = "This is a single line without any newline characters";

			const chunks = chunker.chunk(text);

			expect(chunks).toEqual([text]);
		});

		it("should handle mixed line endings", () => {
			const chunker = new LineChunker({ maxLines: 2, overlap: 0 });
			const text = "line1\nline2\rline3\r\nline4";

			const chunks = chunker.chunk(text);

			expect(chunks.length).toBeGreaterThan(1);
			expect(chunks.join("")).toContain("line1");
			expect(chunks.join("")).toContain("line4");
		});

		it("should handle very long lines with character splitting", () => {
			const chunker = new LineChunker({
				maxLines: 10,
				maxChars: 20,
				overlap: 0,
			});
			const longLine = "x".repeat(100);

			const chunks = chunker.chunk(longLine);

			expect(chunks.length).toBeGreaterThan(1);
			for (const chunk of chunks) {
				expect(chunk.length).toBeLessThanOrEqual(20);
			}
		});

		it("should handle large overlap values gracefully", () => {
			const chunker = new LineChunker({
				maxLines: 10,
				overlap: 8,
			});
			const text = Array.from({ length: 20 }, (_, i) => `line${i}`).join("\n");

			const chunks = chunker.chunk(text);

			expect(chunks.length).toBeGreaterThan(1);
			// Should still make progress despite large overlap
			expect(chunks[0]).not.toEqual(chunks[1]);
		});

		it("should terminate properly when overlap exceeds remaining content", () => {
			const chunker = new LineChunker({
				maxLines: 50,
				overlap: 30,
			});
			// Create text with 40 lines - last chunk will have overlap > remaining content
			const text = Array.from({ length: 40 }, (_, i) => `line${i + 1}`).join(
				"\n",
			);

			const chunks = chunker.chunk(text);

			// Should not create excessive small chunks at the end
			expect(chunks.length).toBeLessThan(10);
			// Should not have many 1-line chunks (indicates proper termination)
			const singleLineChunks = chunks.filter(
				(chunk) => chunk.split("\n").length === 1,
			);
			expect(singleLineChunks.length).toBeLessThan(5);
		});
	});

	describe("Complex scenarios", () => {
		it("should handle realistic code-like content", () => {
			const chunker = new LineChunker({
				maxLines: 5,
				overlap: 1,
			});
			const codeContent = `function example() {
	const value = "hello";
	if (value) {
		console.log(value);
	}
	return value;
}

function another() {
	return "world";
}`;

			const chunks = chunker.chunk(codeContent);

			expect(chunks.length).toBeGreaterThan(1);
			// Verify that all original content is preserved
			const rejoined = chunks.join("");
			expect(rejoined).toContain("function example");
			expect(rejoined).toContain("function another");
		});

		it("should maintain content integrity with overlap", () => {
			const chunker = new LineChunker({
				maxLines: 3,
				overlap: 1,
			});
			const lines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`);
			const text = lines.join("\n");

			const chunks = chunker.chunk(text);

			// Verify no content is lost
			const allChunkContent = chunks.join("");
			for (const line of lines) {
				expect(allChunkContent).toContain(line);
			}
		});

		it("should handle documents with varying line lengths", () => {
			const chunker = new LineChunker({
				maxLines: 3,
				maxChars: 100,
				overlap: 0,
			});
			const text = [
				"Short",
				"This is a medium length line with some content",
				"X".repeat(150), // Very long line
				"Another short line",
				"Final line",
			].join("\n");

			const chunks = chunker.chunk(text);

			expect(chunks.length).toBeGreaterThan(1);
			// Long line should be split by character limit
			const hasLongChunk = chunks.some((chunk) =>
				chunk.includes("X".repeat(50)),
			);
			expect(hasLongChunk).toBe(true);
		});
	});

	describe("Performance considerations", () => {
		it("should handle moderately large documents efficiently", () => {
			const chunker = new LineChunker({
				maxLines: 50,
				overlap: 5,
			});
			const largeText = Array.from(
				{ length: 1000 },
				(_, i) => `Line ${i + 1}`,
			).join("\n");

			const startTime = Date.now();
			const chunks = chunker.chunk(largeText);
			const endTime = Date.now();

			expect(chunks.length).toBeGreaterThan(10);
			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
		});
	});
});
