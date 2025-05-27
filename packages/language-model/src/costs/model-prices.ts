import { ANTHROPIC_MODELS, GOOGLE_MODELS, OPENAI_MODELS } from "../models";
import type { ModelPrice } from "./pricing";
import { defineModelPriceTable } from "./pricing";

export type ModelPriceTable = Record<string, { prices: ModelPrice[] }>;

export const openAiTokenPricing = defineModelPriceTable({
	// https://platform.openai.com/docs/pricing#latest-models
	[OPENAI_MODELS.GPT4_1]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 2.0,
				},
				output: {
					costPerMegaToken: 8.0,
				},
			},
		},
	],
	[OPENAI_MODELS.GPT4_1_MINI]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.4,
				},
				output: {
					costPerMegaToken: 1.6,
				},
			},
		},
	],
	[OPENAI_MODELS.GPT4_1_NANO]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.1,
				},
				output: {
					costPerMegaToken: 0.4,
				},
			},
		},
	],
	[OPENAI_MODELS.GPT4O]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 2.5,
				},
				output: {
					costPerMegaToken: 10.0,
				},
			},
		},
	],
	[OPENAI_MODELS.GPT4O_MINI]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.15,
				},
				output: {
					costPerMegaToken: 0.6,
				},
			},
		},
	],
	[OPENAI_MODELS.O3]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 10.0,
				},
				output: {
					costPerMegaToken: 40.0,
				},
			},
		},
	],
	[OPENAI_MODELS.O3_MINI]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 1.1,
				},
				output: {
					costPerMegaToken: 4.4,
				},
			},
		},
	],
	[OPENAI_MODELS.O4_MINI]: [
		{
			validFrom: "2025-05-12T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 1.1,
				},
				output: {
					costPerMegaToken: 4.4,
				},
			},
		},
	],
});

export const anthropicTokenPricing = defineModelPriceTable({
	// https://www.anthropic.com/pricing
	[ANTHROPIC_MODELS.CLAUDE4_OPUS]: [
		{
			validFrom: "2025-05-23T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 15.0,
				},
				output: {
					costPerMegaToken: 75.0,
				},
			},
		},
	],
	[ANTHROPIC_MODELS.CLAUDE4_SONNET]: [
		{
			validFrom: "2025-05-23T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 3.0,
				},
				output: {
					costPerMegaToken: 15.0,
				},
			},
		},
	],
	[ANTHROPIC_MODELS.CLAUDE3_7_SONNET]: [
		{
			validFrom: "2025-05-19T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 3.0,
				},
				output: {
					costPerMegaToken: 15.0,
				},
			},
		},
	],
	[ANTHROPIC_MODELS.CLAUDE3_5_SONNET]: [
		{
			validFrom: "2025-05-19T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 3.0,
				},
				output: {
					costPerMegaToken: 15.0,
				},
			},
		},
	],
	[ANTHROPIC_MODELS.CLAUDE3_5_HAIKU]: [
		{
			validFrom: "2025-05-19T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.8,
				},
				output: {
					costPerMegaToken: 4.0,
				},
			},
		},
	],
});

export const googleTokenPricing = defineModelPriceTable({
	// https://ai.google.dev/gemini-api/docs/pricing
	[GOOGLE_MODELS.GEMINI_25_PRO_EXP]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.0,
				},
				output: {
					costPerMegaToken: 0.0,
				},
			},
		},
	],
	[GOOGLE_MODELS.GEMINI_25_PRO_PREVIEW]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 1.25,
				},
				output: {
					costPerMegaToken: 10.0,
				},
			},
		},
	],
	[GOOGLE_MODELS.GEMINI_25_FLASH_PREVIEW]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.15,
				},
				output: {
					costPerMegaToken: 0.6, // will be 3.50 if "thinking" enabled
					// thinking option can be controlled using "thinkingBudget" option
					// refs:
					// - https://ai.google.dev/gemini-api/docs/thinking#javascript
					// - https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
				},
			},
		},
	],
	[GOOGLE_MODELS.GEMINI_20_FLASH]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.1,
				},
				output: {
					costPerMegaToken: 0.4,
				},
			},
		},
	],
	[GOOGLE_MODELS.GEMINI_20_FLASH_LITE_PREVIEW]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.075,
				},
				output: {
					costPerMegaToken: 0.3,
				},
			},
		},
	],
	[GOOGLE_MODELS.GEMINI_20_FLASH_THINKING_EXP]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.0,
				},
				output: {
					costPerMegaToken: 0.0,
				},
			},
		},
	],
	[GOOGLE_MODELS.GEMINI_20_PRO_EXP]: [
		{
			validFrom: "2025-05-20T00:00:00Z",
			price: {
				input: {
					costPerMegaToken: 0.0,
				},
				output: {
					costPerMegaToken: 0.0,
				},
			},
		},
	],
});

export function getValidPricing(
	modelId: string,
	priceTable: ModelPriceTable,
): ModelPrice {
	const modelPricing = priceTable[modelId];
	if (!modelPricing) {
		throw new Error(`No pricing found for model ${modelId}`);
	}

	const now = new Date();
	const validPrices = modelPricing.prices
		.filter((price) => new Date(price.validFrom) <= now)
		.sort(
			(a, b) =>
				new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime(),
		);

	if (validPrices.length === 0) {
		throw new Error(`No valid pricing found for model ${modelId}`);
	}

	return validPrices[0];
}
