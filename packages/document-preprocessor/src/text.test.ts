import { describe, expect, it } from "vitest";
import { extractText } from "./text.js";

describe("extractText", () => {
	it("should extract text from a plain text buffer", () => {
		const text = "Hello, World!";
		const buffer = Buffer.from(text, "utf-8");

		const result = extractText(buffer);

		expect(result.text).toBe(text);
	});

	it("should extract text from markdown content", () => {
		const markdown = "# Title\n\nThis is **bold** text.";
		const buffer = Buffer.from(markdown, "utf-8");

		const result = extractText(buffer);

		expect(result.text).toBe(markdown);
	});

	it("should handle empty text", () => {
		const buffer = Buffer.from("", "utf-8");

		const result = extractText(buffer);

		expect(result.text).toBe("");
	});

	it("should handle different encodings", () => {
		const text = "Hello, 世界!";
		const buffer = Buffer.from(text, "utf-8");

		const result = extractText(buffer, { encoding: "utf-8" });

		expect(result.text).toBe(text);
	});

	it("should respect abort signal", () => {
		const controller = new AbortController();
		controller.abort();

		const buffer = Buffer.from("test", "utf-8");

		expect(() => extractText(buffer, { signal: controller.signal })).toThrow();
	});

	it("should work with Uint8Array input", () => {
		const text = "Test with Uint8Array";
		const uint8Array = new TextEncoder().encode(text);

		const result = extractText(uint8Array);

		expect(result.text).toBe(text);
	});
});
