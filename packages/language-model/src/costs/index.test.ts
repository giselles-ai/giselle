import { beforeEach, describe, expect, it } from "vitest";
import { calculateCost } from "./index";

describe("calculateCost", () => {
	describe("Basic cost calculations", () => {
		it("should calculate cost for OpenAI model", async () => {
			const result = await calculateCost("openai", "gpt-4.1", {
				promptTokens: 1000,
				completionTokens: 500,
			});

			expect(result).toEqual({
				inputCost: 0.002, // 1000 tokens * 2.0 per mega token
				outputCost: 0.004, // 500 tokens * 8.0 per mega token
				totalCost: 0.006,
			});
		});

		it("should calculate cost for OpenAI model with zero tokens", async () => {
			const result = await calculateCost("openai", "gpt-4.1", {
				promptTokens: 0,
				completionTokens: 0,
			});

			expect(result).toEqual({
				inputCost: 0,
				outputCost: 0,
				totalCost: 0,
			});
		});
	});

	describe("Floating point precision", () => {
		it("should handle very small token counts precisely", async () => {
			const result = await calculateCost("openai", "gpt-4.1", {
				promptTokens: 1,
				completionTokens: 1,
			});

			// 1 token = 0.000001 mega tokens
			// input: 0.000001 * 2.0 = 0.000002
			// output: 0.000001 * 8.0 = 0.000008
			expect(result).toEqual({
				inputCost: 0.000002,
				outputCost: 0.000008,
				totalCost: 0.00001,
			});
		});
	});
});
