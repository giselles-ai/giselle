import { describe, expect, it } from "vitest";
import { LineChunker } from "./line-chunker";

describe("LineChunker", () => {
	it("should chunk content by lines", async () => {
		const chunker = new LineChunker({ maxLines: 3, overlap: 1 });
		const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";

		const chunks = [];
		for await (const chunk of chunker.chunk(content)) {
			chunks.push(chunk);
		}

		expect(chunks).toHaveLength(2);
		expect(chunks[0].content).toBe("Line 1\nLine 2\nLine 3");
		expect(chunks[0].index).toBe(0);
		expect(chunks[1].content).toBe("Line 3\nLine 4\nLine 5");
		expect(chunks[1].index).toBe(1);
	});

	it("should handle single line content", async () => {
		const chunker = new LineChunker({ maxLines: 3, overlap: 1 });
		const content = "Single line";

		const chunks = [];
		for await (const chunk of chunker.chunk(content)) {
			chunks.push(chunk);
		}

		expect(chunks).toHaveLength(1);
		expect(chunks[0].content).toBe("Single line");
		expect(chunks[0].index).toBe(0);
	});

	it("should skip empty chunks", async () => {
		const chunker = new LineChunker({ maxLines: 2, overlap: 0 });
		const content = "Line 1\n\n\nLine 4";

		const chunks = [];
		for await (const chunk of chunker.chunk(content)) {
			chunks.push(chunk);
		}

		expect(chunks).toHaveLength(2);
		expect(chunks[0].content).toBe("Line 1");
		expect(chunks[1].content).toBe("Line 4");
	});

	it("should use default configuration", async () => {
		const chunker = new LineChunker();
		const content = "Test content";

		const chunks = [];
		for await (const chunk of chunker.chunk(content)) {
			chunks.push(chunk);
		}

		expect(chunks).toHaveLength(1);
		expect(chunks[0].content).toBe("Test content");
	});
});
