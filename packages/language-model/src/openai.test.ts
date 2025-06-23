import { describe, expect, it } from "vitest";
import { OpenAILanguageModelId } from "./openai";

describe("openai llm", () => {
	describe("OpenAILanguageModelId", () => {
		it("should map o-series models correctly", () => {
			expect(OpenAILanguageModelId.parse("o3")).toBe("o3");
			expect(OpenAILanguageModelId.parse("o1")).toBe("o3");
			expect(OpenAILanguageModelId.parse("o4-mini")).toBe("o4-mini");
			expect(OpenAILanguageModelId.parse("o3-mini")).toBe("o4-mini");
			expect(OpenAILanguageModelId.parse("o1-mini")).toBe("o4-mini");
		});

		it("should map flagship chat models correctly", () => {
			expect(OpenAILanguageModelId.parse("gpt-4.1")).toBe("gpt-4.1");
			expect(OpenAILanguageModelId.parse("gpt-4o")).toBe("gpt-4o");
		});

		it("should map cost-optimized models correctly", () => {
			expect(OpenAILanguageModelId.parse("gpt-4.1-mini")).toBe("gpt-4.1-mini");
			expect(OpenAILanguageModelId.parse("gpt-4.1-nano")).toBe("gpt-4.1-nano");
		});

		it("should map gpt-4o-mini to gpt-4.1-mini", () => {
			expect(OpenAILanguageModelId.parse("gpt-4o-mini")).toBe("gpt-4.1-mini");
		});

		it("should map older GPT models to gpt-4o", () => {
			expect(OpenAILanguageModelId.parse("gpt-4-turbo")).toBe("gpt-4o");
			expect(OpenAILanguageModelId.parse("gpt-4")).toBe("gpt-4o");
			expect(OpenAILanguageModelId.parse("gpt-3.5-turbo")).toBe("gpt-4o");
		});

		it("should fallback unknown or non-matching variants to gpt-4.1-nano", () => {
			expect(OpenAILanguageModelId.parse("openai-unknown-model")).toBe(
				"gpt-4.1-nano",
			);
			expect(OpenAILanguageModelId.parse("openai-foo-bar")).toBe(
				"gpt-4.1-nano",
			);
			expect(OpenAILanguageModelId.parse("random-model")).toBe("gpt-4.1-nano");
			expect(OpenAILanguageModelId.parse("not-a-model-id")).toBe(
				"gpt-4.1-nano",
			);
		});
	});
});
