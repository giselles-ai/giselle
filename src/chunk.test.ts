import { describe, expect, it } from "vitest";
import { LineChunker, createLineChunker } from "./chunk";

describe("LineChunker", () => {
	describe("constructor validation", () => {
		it("should throw error when maxLines is zero or negative", () => {
			expect(() => new LineChunker({ maxLines: 0 })).toThrow(
				"Invalid value for maxLines: 0. Must be positive.",
			);
			expect(() => new LineChunker({ maxLines: -1 })).toThrow(
				"Invalid value for maxLines: -1. Must be positive.",
			);
		});

		it("should throw error when maxChunkSize is zero or negative", () => {
			expect(() => new LineChunker({ maxChunkSize: 0 })).toThrow(
				"Invalid value for maxChunkSize: 0. Must be positive.",
			);
			expect(() => new LineChunker({ maxChunkSize: -1 })).toThrow(
				"Invalid value for maxChunkSize: -1. Must be positive.",
			);
		});

		it("should throw error when overlap is negative", () => {
			expect(() => new LineChunker({ overlap: -1 })).toThrow(
				"Invalid value for overlap: -1. Must be non-negative.",
			);
		});

		it("should throw error when minChunkSize is negative", () => {
			expect(() => new LineChunker({ minChunkSize: -1 })).toThrow(
				"Invalid value for minChunkSize: -1. Must be non-negative.",
			);
		});

		it("should throw error when overlap is greater than or equal to maxLines", () => {
			expect(() => new LineChunker({ maxLines: 3, overlap: 3 })).toThrow(
				"Invalid configuration: overlap (3) must be less than maxLines (3).",
			);
			expect(() => new LineChunker({ maxLines: 3, overlap: 5 })).toThrow(
				"Invalid configuration: overlap (5) must be less than maxLines (3).",
			);
		});

		it("should create instance with default options", () => {
			expect(() => new LineChunker()).not.toThrow();
			expect(() => new LineChunker({})).not.toThrow();
		});
	});

	describe("line-based chunking", () => {
		it("should split content into chunks based on line count", async () => {
			const chunker = new LineChunker({
				maxLines: 3,
				overlap: 1,
				minChunkSize: 0,
			});
			const content = "line1\nline2\nline3\nline4\nline5";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(3);
			expect(chunks[0]).toEqual({
				content: "line1\nline2\nline3",
				index: 0,
			});
			expect(chunks[1]).toEqual({
				content: "line3\nline4\nline5",
				index: 1,
			});
			expect(chunks[2]).toEqual({
				content: "line5",
				index: 2,
			});
		});

		it("should handle content with fewer lines than maxLines", async () => {
			const chunker = new LineChunker({
				maxLines: 5,
				overlap: 1,
				minChunkSize: 0,
			});
			const content = "line1\nline2";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(1);
			expect(chunks[0]).toEqual({
				content: "line1\nline2",
				index: 0,
			});
		});

		it("should respect no overlap when overlap is 0", async () => {
			const chunker = new LineChunker({
				maxLines: 2,
				overlap: 0,
				minChunkSize: 0,
			});
			const content = "line1\nline2\nline3\nline4";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(2);
			expect(chunks[0].content).toBe("line1\nline2");
			expect(chunks[1].content).toBe("line3\nline4");
		});
	});

	describe("character limit enforcement", () => {
		it("should split chunks that exceed maxChunkSize", async () => {
			const chunker = new LineChunker({
				maxLines: 10,
				maxChunkSize: 20,
				overlap: 0,
				minChunkSize: 0,
			});
			const content =
				"This is a very long line that exceeds the character limit and should be split";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks.length).toBeGreaterThan(1);
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(20);
			}
		});

		it("should handle very long single line", async () => {
			const chunker = new LineChunker({ maxChunkSize: 100, minChunkSize: 0 });
			const longLine = "a".repeat(250);

			const chunks = [];
			for await (const chunk of chunker.chunk(longLine)) {
				chunks.push(chunk);
			}

			expect(chunks.length).toBeGreaterThanOrEqual(3);
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(100);
			}

			// Verify content is preserved
			const reconstructed = chunks.map((c) => c.content).join("");
			expect(reconstructed.replace(/\s+/g, "")).toBe(longLine);
		});

		it("should prioritize character limit over line limit", async () => {
			const chunker = new LineChunker({
				maxLines: 10,
				maxChunkSize: 50,
				overlap: 0,
				minChunkSize: 0,
			});
			// Create content where 2 lines exceed character limit
			const content =
				"This is a long line that will exceed char limit\nAnother long line that will also exceed";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(50);
			}
		});
	});

	describe("minimum chunk size handling", () => {
		it("should filter out chunks smaller than minChunkSize", async () => {
			const chunker = new LineChunker({
				maxLines: 2,
				overlap: 0,
				minChunkSize: 10,
			});
			const content = "short\nok this is longer\ntiny";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			// Only chunks meeting minimum size should be included
			for (const chunk of chunks) {
				expect(chunk.content.trim().length).toBeGreaterThanOrEqual(10);
			}
		});

		it("should always include chunk if it's the only one, even if below minChunkSize", async () => {
			const chunker = new LineChunker({ minChunkSize: 100 });
			const content = "short";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(1);
			expect(chunks[0].content).toBe("short");
		});
	});

	describe("edge cases", () => {
		it("should handle empty content", async () => {
			const chunker = new LineChunker({ minChunkSize: 0 });
			const content = "";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(1);
			expect(chunks[0].content).toBe("");
		});

		it("should handle content with only newlines", async () => {
			const chunker = new LineChunker({
				maxLines: 2,
				overlap: 0,
				minChunkSize: 0,
			});
			const content = "\n\n\n";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			// Should create chunks from empty lines
			expect(chunks.length).toBeGreaterThan(0);
		});

		it("should handle content with mixed line lengths", async () => {
			const chunker = new LineChunker({
				maxLines: 3,
				maxChunkSize: 100,
				overlap: 1,
				minChunkSize: 0,
			});
			const content = `short\n${"a".repeat(80)}\nmedium length line\nshort`;

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			// Should handle mixed content appropriately
			expect(chunks.length).toBeGreaterThan(0);
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(100);
			}
		});

		it("should trim whitespace from chunks", async () => {
			const chunker = new LineChunker({
				maxLines: 2,
				overlap: 0,
				minChunkSize: 0,
			});
			const content = "  line1  \n  line2  \n  line3  ";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			for (const chunk of chunks) {
				expect(chunk.content).not.toMatch(/^\s|\s$/);
			}
		});
	});

	describe("createLineChunker helper", () => {
		it("should create LineChunker with default options", async () => {
			const chunker = createLineChunker();
			const content = "line1\nline2\nline3";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(1);
			expect(chunks[0].content).toBe("line1\nline2\nline3");
		});

		it("should create LineChunker with custom options", async () => {
			const chunker = createLineChunker({
				maxLines: 2,
				overlap: 0,
				minChunkSize: 0,
			});
			const content = "line1\nline2\nline3\nline4";

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(2);
			expect(chunks[0].content).toBe("line1\nline2");
			expect(chunks[1].content).toBe("line3\nline4");
		});
	});

	describe("integration tests", () => {
		it("should handle realistic document content", async () => {
			const chunker = new LineChunker({
				maxLines: 50,
				maxChunkSize: 1000,
				overlap: 5,
				minChunkSize: 100,
			});

			// Create realistic content
			const paragraphs = [
				"This is the first paragraph of a document. It contains multiple sentences that describe various concepts and ideas.",
				"The second paragraph builds upon the first, introducing new concepts while maintaining context from the previous section.",
				"Finally, the third paragraph concludes the discussion with a comprehensive summary of all the points covered.",
			];
			const content = paragraphs.join("\n\n");

			const chunks = [];
			for await (const chunk of chunker.chunk(content)) {
				chunks.push(chunk);
			}

			// Should create reasonable chunks
			expect(chunks.length).toBeGreaterThan(0);
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(1000);
				expect(chunk.content.trim().length).toBeGreaterThanOrEqual(100);
				expect(chunk.index).toBeGreaterThanOrEqual(0);
			}
		});
	});
});
