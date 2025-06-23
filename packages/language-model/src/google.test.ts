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
		});
	});

	describe("GoogleLanguageModelId fallback cases", () => {
		it("should fallback all known gemini-2.5-pro variants and any version to gemini-2.5-pro", () => {
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-preview-06-05")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-preview-05-06")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.5-pro-exp-03-25")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-2.0-pro")).toBe(
				"gemini-2.5-pro",
			);
			expect(GoogleLanguageModelId.parse("gemini-1.5-pro")).toBe(
				"gemini-2.5-pro",
			);
		});

		it("should fallback all known gemini-2.5-flash variants and any version to gemini-2.5-flash", () => {
			expect(GoogleLanguageModelId.parse("gemini-2.5-flash")).toBe(
				"gemini-2.5-flash",
			);
			expect(
				GoogleLanguageModelId.parse("gemini-2.5-flash-preview-05-20"),
			).toBe("gemini-2.5-flash");
			expect(GoogleLanguageModelId.parse("gemini-2.0-flash")).toBe(
				"gemini-2.5-flash",
			);
			expect(GoogleLanguageModelId.parse("gemini-1.5-flash")).toBe(
				"gemini-2.5-flash",
			);
		});

		it("should fallback all known gemini-2.5-flash-lite variants and any version to gemini-2.5-flash-lite-preview-06-17", () => {
			expect(
				GoogleLanguageModelId.parse("gemini-2.5-flash-lite-preview-06-17"),
			).toBe("gemini-2.5-flash-lite-preview-06-17");
			expect(GoogleLanguageModelId.parse("gemini-2.0-flash-lite")).toBe(
				"gemini-2.5-flash-lite-preview-06-17",
			);
			expect(GoogleLanguageModelId.parse("gemini-1.5-flash-lite")).toBe(
				"gemini-2.5-flash-lite-preview-06-17",
			);
		});

		it("should fallback unknown or non-matching variants to gemini-2.5-flash-lite-preview-06-17", () => {
			expect(GoogleLanguageModelId.parse("gemini-unknown-model")).toBe(
				"gemini-2.5-flash-lite-preview-06-17",
			);
			expect(GoogleLanguageModelId.parse("gemini-foo-bar")).toBe(
				"gemini-2.5-flash-lite-preview-06-17",
			);
			expect(GoogleLanguageModelId.parse("random-model")).toBe(
				"gemini-2.5-flash-lite-preview-06-17",
			);
		});
	});
});
