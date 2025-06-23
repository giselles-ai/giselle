import { describe, expect, it } from "vitest";
import { AnthropicLanguageModelId } from "./anthropic";

describe("anthropic llm", () => {
	describe("AnthropicLanguageModelId", () => {
		it("should parse valid enum values successfully", () => {
			expect(AnthropicLanguageModelId.parse("claude-4-opus-20250514")).toBe(
				"claude-4-opus-20250514",
			);
			expect(AnthropicLanguageModelId.parse("claude-4-sonnet-20250514")).toBe(
				"claude-4-sonnet-20250514",
			);
			expect(AnthropicLanguageModelId.parse("claude-3-7-sonnet-20250219")).toBe(
				"claude-3-7-sonnet-20250219",
			);
			expect(AnthropicLanguageModelId.parse("claude-3-5-haiku-20241022")).toBe(
				"claude-3-5-haiku-20241022",
			);
		});

		it("should fallback claude-opus-4-* to claude-4-opus-20250514", () => {
			expect(AnthropicLanguageModelId.parse("claude-4-opus-4-foo")).toBe(
				"claude-4-opus-20250514",
			);
		});

		it("should fallback claude-sonnet-4-* to claude-4-sonnet-20250514", () => {
			expect(AnthropicLanguageModelId.parse("claude-4-sonnet-4-bar")).toBe(
				"claude-4-sonnet-20250514",
			);
		});

		it("should fallback claude-3-7-sonnet-* to claude-3-7-sonnet-20250219", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-7-sonnet-xyz")).toBe(
				"claude-3-7-sonnet-20250219",
			);
		});

		it("should fallback claude-3-5-haiku-* to claude-3-5-haiku-20241022", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-5-haiku-abc")).toBe(
				"claude-3-5-haiku-20241022",
			);
		});

		it("should fallback claude-3-5-sonnet-* to claude-3-7-sonnet-20250219", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-5-sonnet-foo")).toBe(
				"claude-3-7-sonnet-20250219",
			);
		});

		it("should fallback claude-3-opus-* to claude-4-opus-20250514", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-opus-foo")).toBe(
				"claude-4-opus-20250514",
			);
		});

		it("should fallback claude-3-sonnet-* to claude-3-7-sonnet-20250219", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-sonnet-foo")).toBe(
				"claude-3-7-sonnet-20250219",
			);
		});

		it("should fallback claude-3-haiku-* to claude-3-5-haiku-20241022", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-haiku-bar")).toBe(
				"claude-3-5-haiku-20241022",
			);
		});

		it("should fallback unknown or non-matching variants to claude-3-5-haiku-20241022", () => {
			expect(AnthropicLanguageModelId.parse("anthropic-unknown-model")).toBe(
				"claude-3-5-haiku-20241022",
			);
			expect(AnthropicLanguageModelId.parse("anthropic-foo-bar")).toBe(
				"claude-3-5-haiku-20241022",
			);
			expect(AnthropicLanguageModelId.parse("random-model")).toBe(
				"claude-3-5-haiku-20241022",
			);
		});
	});
});
