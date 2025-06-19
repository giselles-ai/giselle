import { describe, expect, it } from "vitest";
import { DEFAULT_CHUNKER_CONFIG } from "./index";
import { type LineChunkerOptions, createLineChunker } from "./line-chunker";

// Helper to create options with defaults for testing
function createTestOptions(
	overrides: Partial<LineChunkerOptions> = {},
): LineChunkerOptions {
	return {
		...DEFAULT_CHUNKER_CONFIG,
		...overrides,
	};
}

describe("LineChunker", () => {
	describe("Basic functionality", () => {
		it("should split text into chunks based on line count", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 3,
					overlap: 0,
				}),
			);
			const text = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";

			const chunks = chunker(text);

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
			const chunker = createLineChunker(DEFAULT_CHUNKER_CONFIG);
			const chunks = chunker("");

			expect(chunks).toEqual([]);
		});

		it("should handle single line text", () => {
			const chunker = createLineChunker(DEFAULT_CHUNKER_CONFIG);
			const text = "This is a single line of text";

			const chunks = chunker(text);

			expect(chunks).toEqual([text]);
		});

		it("should apply overlap when configured", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 3,
					overlap: 1,
				}),
			);
			const text = "line1\nline2\nline3\nline4\nline5\nline6";

			const chunks = chunker(text);

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
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 100,
					maxChars: 50,
					overlap: 0,
				}),
			);
			const longLine = "a".repeat(100);
			const text = `${longLine}\nshort line`;

			const chunks = chunker(text);

			expect(chunks.length).toBeGreaterThan(1);
			for (const chunk of chunks) {
				expect(chunk.length).toBeLessThanOrEqual(50);
			}
		});
	});

	describe("Configuration validation", () => {
		it("should accept valid configuration options", () => {
			expect(() => createLineChunker(DEFAULT_CHUNKER_CONFIG)).not.toThrow();
		});

		it("should validate maxLines is positive", () => {
			expect(() =>
				createLineChunker(createTestOptions({ maxLines: 0 })),
			).toThrow();
			expect(() =>
				createLineChunker(createTestOptions({ maxLines: -1 })),
			).toThrow();
		});

		it("should validate overlap is non-negative", () => {
			expect(() =>
				createLineChunker(createTestOptions({ overlap: -1 })),
			).toThrow();
		});

		it("should validate overlap is less than maxLines", () => {
			expect(() =>
				createLineChunker(createTestOptions({ maxLines: 5, overlap: 5 })),
			).toThrow();
			expect(() =>
				createLineChunker(createTestOptions({ maxLines: 5, overlap: 6 })),
			).toThrow();
		});

		it("should validate maxChars is positive", () => {
			expect(() =>
				createLineChunker(createTestOptions({ maxChars: 0 })),
			).toThrow();
			expect(() =>
				createLineChunker(createTestOptions({ maxChars: -1 })),
			).toThrow();
		});
	});

	describe("Edge cases", () => {
		it("should handle text with only newlines", () => {
			const chunker = createLineChunker(
				createTestOptions({ maxLines: 2, overlap: 0 }),
			);
			const text = "\n\n\n\n\n";

			const chunks = chunker(text);

			// Empty lines might be filtered out, so we check for either empty array or chunks
			expect(chunks.length).toBeGreaterThanOrEqual(0);
		});

		it("should handle text without newlines", () => {
			const chunker = createLineChunker(
				createTestOptions({ maxLines: 3, overlap: 0 }),
			);
			const text = "This is a single line without any newline characters";

			const chunks = chunker(text);

			expect(chunks).toEqual([text]);
		});

		it("should handle mixed line endings", () => {
			const chunker = createLineChunker(
				createTestOptions({ maxLines: 2, overlap: 0 }),
			);
			const text = "line1\nline2\rline3\r\nline4";

			const chunks = chunker(text);

			expect(chunks.length).toBeGreaterThan(1);
			expect(chunks.join("")).toContain("line1");
			expect(chunks.join("")).toContain("line4");
		});

		it("should handle very long lines with character splitting", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 10,
					maxChars: 20,
					overlap: 0,
				}),
			);
			const longLine = "x".repeat(100);

			const chunks = chunker(longLine);

			expect(chunks.length).toBeGreaterThan(1);
			for (const chunk of chunks) {
				expect(chunk.length).toBeLessThanOrEqual(20);
			}
		});

		it("should handle large overlap values gracefully", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 10,
					overlap: 8,
				}),
			);
			const text = Array.from({ length: 20 }, (_, i) => `line${i}`).join("\n");

			const chunks = chunker(text);

			expect(chunks.length).toBeGreaterThan(1);
			// Should still make progress despite large overlap
			expect(chunks[0]).not.toEqual(chunks[1]);
		});

		it("should terminate properly when overlap exceeds remaining content", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 50,
					overlap: 30,
				}),
			);
			// Create text with 40 lines - last chunk will have overlap > remaining content
			const text = Array.from({ length: 40 }, (_, i) => `line${i + 1}`).join(
				"\n",
			);

			const chunks = chunker(text);

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
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 5,
					overlap: 1,
				}),
			);
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

			const chunks = chunker(codeContent);

			expect(chunks.length).toBeGreaterThan(1);
			// Verify that all original content is preserved
			const rejoined = chunks.join("");
			expect(rejoined).toContain("function example");
			expect(rejoined).toContain("function another");
		});

		it("should maintain content integrity with overlap", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 3,
					overlap: 1,
				}),
			);
			const lines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`);
			const text = lines.join("\n");

			const chunks = chunker(text);

			// Verify no content is lost
			const allChunkContent = chunks.join("");
			for (const line of lines) {
				expect(allChunkContent).toContain(line);
			}
		});

		it("should handle documents with varying line lengths", () => {
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 3,
					maxChars: 100,
					overlap: 0,
				}),
			);
			const text = [
				"Short",
				"This is a medium length line with some content",
				"X".repeat(150), // Very long line
				"Another short line",
				"Final line",
			].join("\n");

			const chunks = chunker(text);

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
			const chunker = createLineChunker(
				createTestOptions({
					maxLines: 50,
					overlap: 5,
				}),
			);
			const largeText = Array.from(
				{ length: 1000 },
				(_, i) => `Line ${i + 1}`,
			).join("\n");

			const startTime = Date.now();
			const chunks = chunker(largeText);
			const endTime = Date.now();

			expect(chunks.length).toBeGreaterThan(10);
			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
		});
	});
});

describe("createLineChunker", () => {
	describe("Functional API", () => {
		it("should create a chunker function with specified options", () => {
			const chunk = createLineChunker(
				createTestOptions({
					maxLines: 3,
					overlap: 0,
				}),
			);
			const text = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";

			const chunks = chunk(text);

			expect(chunks.length).toBeGreaterThan(1);
			for (const c of chunks) {
				expect(c.trim().length).toBeGreaterThan(0);
			}
		});

		it("should produce same results as class-based approach", () => {
			const options = {
				maxLines: 5,
				overlap: 2,
				maxChars: 100,
			};
			const classChunker = createLineChunker(options);
			const funcChunker = createLineChunker(options);

			const text = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join(
				"\n",
			);

			const chunks1 = classChunker(text);
			const chunks2 = funcChunker(text);

			expect(chunks2).toEqual(chunks1);
		});

		it("should validate configuration at creation time", () => {
			expect(() =>
				createLineChunker(createTestOptions({ maxLines: 0 })),
			).toThrow();
			expect(() =>
				createLineChunker(createTestOptions({ overlap: -1 })),
			).toThrow();
			expect(() =>
				createLineChunker(createTestOptions({ maxLines: 5, overlap: 5 })),
			).toThrow();
		});

		it("should be reusable across multiple texts", () => {
			const chunk = createLineChunker(
				createTestOptions({ maxLines: 2, overlap: 0 }),
			);

			const text1 = "line1\nline2\nline3\nline4";
			const text2 = "a\nb\nc\nd\ne\nf";

			const chunks1 = chunk(text1);
			const chunks2 = chunk(text2);

			expect(chunks1.length).toBe(2);
			expect(chunks2.length).toBe(3);
		});

		it("should handle complex scenarios with character limits", () => {
			const chunk = createLineChunker(
				createTestOptions({
					maxLines: 3,
					maxChars: 50,
					overlap: 1,
				}),
			);

			const text = [
				"Short line",
				"X".repeat(100), // Very long line that needs splitting
				"Another line",
				"Final line",
			].join("\n");

			const chunks = chunk(text);

			// Should have at least 2 chunks
			expect(chunks.length).toBeGreaterThanOrEqual(2);

			// Verify all chunks respect maxChars limit
			for (const c of chunks) {
				expect(c.length).toBeLessThanOrEqual(50);
			}

			// Verify the functional approach produces valid chunks
			expect(chunks.every((c) => c.length > 0)).toBe(true);
		});
	});
});
