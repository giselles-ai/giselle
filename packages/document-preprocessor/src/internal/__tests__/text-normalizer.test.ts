import { describe, expect, it } from "vitest";

import { normalizeExtractedText } from "../text-normalizer.js";

describe("normalizeExtractedText", () => {
	it("returns empty string for empty input", () => {
		expect(normalizeExtractedText("")).toBe("");
	});

	it("handles complex mixed content edge cases", () => {
		const input = "Hello\u200B\r\n\r\nWorld-\nTest  \tmultiple   spaces\n\n\n";
		const result = normalizeExtractedText(input);
		expect(result).toBe("Hello\n\nWorldTest multiple spaces");
	});

	it("preserves and normalizes unicode (NFKC)", () => {
		const input = "café";
		const result = normalizeExtractedText(input);
		// If the function normalizes to NFKC, this passes for both composed and decomposed forms.
		expect(result).toBe("café");
	});

	it("removes zero width characters and normalizes whitespace", () => {
		const input = "Hello\u200B World\n\n\nThis  is\t\ttext";
		const result = normalizeExtractedText(input);
		expect(result).toBe("Hello World\n\nThis is text");
	});

	it("merges hyphenated line breaks", () => {
		const input = "Hyphen-\nated word";
		const result = normalizeExtractedText(input);
		expect(result).toBe("Hyphenated word");
	});

	it("returns empty string for whitespace-only input", () => {
		const input = "  \n\t";
		const result = normalizeExtractedText(input);
		expect(result).toBe("");
	});
});
