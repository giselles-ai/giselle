import { describe, expect, it } from "vitest";
import { OpenAILanguageModelId } from "./openai";

describe("openai llm", () => {
	describe("OpenAILanguageModelId", () => {
		it("should map GPT-5 models correctly", () => {
			expect(OpenAILanguageModelId.parse("gpt-5.1-thinking")).toBe(
				"gpt-5.1-thinking",
			);
			expect(OpenAILanguageModelId.parse("gpt-5.1-codex")).toBe(
				"gpt-5.1-codex",
			);
			expect(OpenAILanguageModelId.parse("gpt-5")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("gpt-5-mini")).toBe("gpt-5-mini");
			expect(OpenAILanguageModelId.parse("gpt-5-nano")).toBe("gpt-5-nano");
		});

		it("should fallback deprecated models to GPT-5 series", () => {
			expect(OpenAILanguageModelId.parse("gpt-5.1-thinking-20251001")).toBe(
				"gpt-5.1-thinking",
			);
			expect(OpenAILanguageModelId.parse("gpt-5.1-codex-20251001")).toBe(
				"gpt-5.1-codex",
			);

			// Fallback to gpt-5
			expect(OpenAILanguageModelId.parse("gpt-4o")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("o3")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("gpt-4.1")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("o1")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("gpt-4-turbo")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("gpt-4")).toBe("gpt-5");
			expect(OpenAILanguageModelId.parse("gpt-3.5-turbo")).toBe("gpt-5");

			// Fallback to gpt-5-mini
			expect(OpenAILanguageModelId.parse("o4-mini")).toBe("gpt-5-mini");
			expect(OpenAILanguageModelId.parse("gpt-4.1-mini")).toBe("gpt-5-mini");
			expect(OpenAILanguageModelId.parse("o3-mini")).toBe("gpt-5-mini");
			expect(OpenAILanguageModelId.parse("o1-mini")).toBe("gpt-5-mini");
			expect(OpenAILanguageModelId.parse("gpt-4o-mini")).toBe("gpt-5-mini");

			// Fallback to gpt-5-nano
			expect(OpenAILanguageModelId.parse("gpt-4.1-nano")).toBe("gpt-5-nano");
		});

		it("should fallback unknown models to gpt-5-nano", () => {
			expect(OpenAILanguageModelId.parse("openai-unknown-model")).toBe(
				"gpt-5-nano",
			);
			expect(OpenAILanguageModelId.parse("openai-foo-bar")).toBe("gpt-5-nano");
			expect(OpenAILanguageModelId.parse("random-model")).toBe("gpt-5-nano");
			expect(OpenAILanguageModelId.parse("not-a-model-id")).toBe("gpt-5-nano");
		});
	});
});
