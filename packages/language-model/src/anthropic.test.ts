import { describe, expect, it } from "vitest";
import { AnthropicLanguageModelId } from "./anthropic";

describe("anthropic llm", () => {
	describe("AnthropicLanguageModelId", () => {
		it("should parse valid enum values successfully", () => {
			expect(AnthropicLanguageModelId.parse("claude-opus-4.5")).toBe(
				"claude-opus-4.5",
			);
			expect(AnthropicLanguageModelId.parse("claude-sonnet-4-5-20250929")).toBe(
				"claude-sonnet-4-5-20250929",
			);
			expect(AnthropicLanguageModelId.parse("claude-haiku-4-5-20251001")).toBe(
				"claude-haiku-4-5-20251001",
			);
		});

		it("should fallback claude-opus-4-5-* to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-opus-4-5-foo")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-opus-4-1-* to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-opus-4-1-foo")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-opus-4-1-20250805 to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-opus-4-1-20250805")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-4-5-opus-* to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-4-5-opus-4-foo")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-4.5-opus-* to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-4.5-opus-foo")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-4-opus-* to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-4-opus-4-foo")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-sonnet-4-5-* to claude-sonnet-4-5-20250929", () => {
			expect(AnthropicLanguageModelId.parse("claude-sonnet-4-5-foo")).toBe(
				"claude-sonnet-4-5-20250929",
			);
		});

		it("should fallback claude-haiku-4-5-* to claude-haiku-4-5-20251001", () => {
			expect(AnthropicLanguageModelId.parse("claude-haiku-4-5-bar")).toBe(
				"claude-haiku-4-5-20251001",
			);
		});

		it("should fallback claude-4-sonnet-* to claude-sonnet-4-5-20250929", () => {
			expect(AnthropicLanguageModelId.parse("claude-4-sonnet-4-bar")).toBe(
				"claude-sonnet-4-5-20250929",
			);
		});

		it("should fallback claude-3-7-sonnet-* to claude-sonnet-4-5-20250929", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-7-sonnet-xyz")).toBe(
				"claude-sonnet-4-5-20250929",
			);
		});

		it("should fallback claude-3-5-haiku-* to claude-haiku-4-5-20251001", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-5-haiku-abc")).toBe(
				"claude-haiku-4-5-20251001",
			);
		});

		it("should fallback claude-3-5-sonnet-* to claude-sonnet-4-5-20250929", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-5-sonnet-foo")).toBe(
				"claude-sonnet-4-5-20250929",
			);
		});

		it("should fallback claude-3-sonnet-* to claude-sonnet-4-5-20250929", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-sonnet-foo")).toBe(
				"claude-sonnet-4-5-20250929",
			);
		});

		it("should fallback claude-3-opus-* to claude-opus-4.5", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-opus-foo")).toBe(
				"claude-opus-4.5",
			);
		});

		it("should fallback claude-3-haiku-* to claude-haiku-4-5-20251001", () => {
			expect(AnthropicLanguageModelId.parse("claude-3-haiku-bar")).toBe(
				"claude-haiku-4-5-20251001",
			);
		});

		it("should fallback unknown or non-matching variants to claude-haiku-4-5-20251001", () => {
			expect(AnthropicLanguageModelId.parse("anthropic-unknown-model")).toBe(
				"claude-haiku-4-5-20251001",
			);
			expect(AnthropicLanguageModelId.parse("anthropic-foo-bar")).toBe(
				"claude-haiku-4-5-20251001",
			);
			expect(AnthropicLanguageModelId.parse("random-model")).toBe(
				"claude-haiku-4-5-20251001",
			);
		});
	});
});
