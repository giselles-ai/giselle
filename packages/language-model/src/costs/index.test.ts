import { describe, expect, it } from "vitest";
import { calculateDisplayCost } from "./index";

describe("calculateDisplayCost", () => {
	describe("Basic cost calculations", () => {
		it("should calculate display cost for OpenAI model", async () => {
			const result = await calculateDisplayCost("openai", "gpt-4.1", {
				promptTokens: 1000,
				completionTokens: 500,
			});

			expect(result).toEqual({
				inputCostForDisplay: 0.002, // 1000 tokens * 2.0 per mega token
				outputCostForDisplay: 0.004, // 500 tokens * 8.0 per mega token
				totalCostForDisplay: 0.006,
			});
		});

		it("should calculate display cost for OpenAI model with zero tokens", async () => {
			const result = await calculateDisplayCost("openai", "gpt-4.1", {
				promptTokens: 0,
				completionTokens: 0,
			});

			expect(result).toEqual({
				inputCostForDisplay: 0,
				outputCostForDisplay: 0,
				totalCostForDisplay: 0,
			});
		});
	});

	describe("Floating point precision", () => {
		it("should handle very small token counts precisely", async () => {
			const result = await calculateDisplayCost("openai", "gpt-4.1", {
				promptTokens: 1,
				completionTokens: 1,
			});

			// 1 token = 0.000001 mega tokens
			// input: 0.000001 * 2.0 = 0.000002
			// output: 0.000001 * 8.0 = 0.000008
			expect(result).toEqual({
				inputCostForDisplay: 0.000002,
				outputCostForDisplay: 0.000008,
				totalCostForDisplay: 0.00001,
			});
		});
	});
});
