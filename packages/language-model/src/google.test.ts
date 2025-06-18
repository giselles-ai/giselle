import { describe, expect, it } from "vitest";
import { GoogleLanguageModelId } from "./google";

describe("google llm", () => {
	describe("GoogleLanguageModelId", () => {
		it("should parse valid enum values successfully", () => {
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-flash")).toBe(
				"gemini-2.5-flash",
			);
			expect(
				GoogleLanguageModelId.parse("gemini-2.5-flash-lite-preview-06-17"),
			).toBe("gemini-2.5-flash-lite-preview-06-17");
			expect(GoogleLanguageModelId.parse("gemini-2.5-flash")).toBe(
				"gemini-2.5-flash",
			);
		});

		it("should fallback gemini-2.5-pro-preview variants to gemini-2.5-pro", () => {
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-preview-03-25")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-preview-01-01")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-preview-12-31")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-preview-")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-1.5-flash")).toBe(
				"gemini-2.5-flash",
			);
		});
	});
});
