import { describe, expect, it } from "vitest";
import { calculateDisplayCost } from "./index";

describe("calculateDisplayCost", () => {
	describe("Basic cost calculations", () => {
		it("should calculate display cost for OpenAI model", async () => {
			const result = await calculateDisplayCost("openai", "gpt-5", {
				inputTokens: 1000,
				outputTokens: 500,
			});

			expect(result).toEqual({
				inputCostForDisplay: 0.00125, // 1000 tokens * 1.25 per mega token
				outputCostForDisplay: 0.005, // 500 tokens * 10.0 per mega token
				totalCostForDisplay: 0.00625,
			});
		});

		it("should calculate display cost for Google Gemini 3 Pro Preview model", async () => {
			const result = await calculateDisplayCost(
				"google",
				"gemini-3-pro-preview",
				{
					inputTokens: 1000,
					outputTokens: 500,
				},
			);

			expect(result).toEqual({
				inputCostForDisplay: 0.002, // 1000 tokens * 2.0 per mega token
				outputCostForDisplay: 0.006, // 500 tokens * 12.0 per mega token
				totalCostForDisplay: 0.008,
			});
		});

		it("should calculate display cost for OpenAI model with zero tokens", async () => {
			const result = await calculateDisplayCost("openai", "gpt-5", {
				inputTokens: 0,
				outputTokens: 0,
			});

			expect(result).toEqual({
				inputCostForDisplay: 0,
				outputCostForDisplay: 0,
				totalCostForDisplay: 0,
			});
		});
	});

	it("should calculate display cost for OpenAI gpt-5-codex model", async () => {
		const result = await calculateDisplayCost("openai", "gpt-5-codex", {
			inputTokens: 1000,
			outputTokens: 500,
		});

		expect(result).toEqual({
			inputCostForDisplay: 0.00125,
			outputCostForDisplay: 0.005,
			totalCostForDisplay: 0.00625,
		});
	});

	it("should calculate display cost for OpenAI gpt-5.1-thinking model", async () => {
		const result = await calculateDisplayCost("openai", "gpt-5.1-thinking", {
			inputTokens: 1000,
			outputTokens: 500,
		});

		expect(result).toEqual({
			inputCostForDisplay: 0.00125,
			outputCostForDisplay: 0.005,
			totalCostForDisplay: 0.00625,
		});
	});

	it("should calculate display cost for OpenAI gpt-5.1-codex model", async () => {
		const result = await calculateDisplayCost("openai", "gpt-5.1-codex", {
			inputTokens: 1000,
			outputTokens: 500,
		});

		expect(result).toEqual({
			inputCostForDisplay: 0.00125,
			outputCostForDisplay: 0.005,
			totalCostForDisplay: 0.00625,
		});
	});

	describe("Floating point precision", () => {
		it("should handle very small token counts precisely", async () => {
			const result = await calculateDisplayCost("openai", "gpt-5", {
				inputTokens: 1,
				outputTokens: 1,
			});

			// 1 token = 0.000001 mega tokens
			// input: 0.000001 * 1.25 = 0.00000125
			// output: 0.000001 * 10.0 = 0.00001
			expect(result).toEqual({
				inputCostForDisplay: 0.00000125,
				outputCostForDisplay: 0.00001,
				totalCostForDisplay: 0.00001125,
			});
		});
	});
});
