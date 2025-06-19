import type { LanguageModel } from "../google";
import type { ModelPrice } from "./pricing";

export type ModelPriceTable = Record<string, { prices: ModelPrice[] }>;

type GoogleModelId = LanguageModel["id"];

export const openAiTokenPricing: ModelPriceTable = {
	// https://platform.openai.com/docs/pricing#latest-models
	"gpt-4.1": {
		prices: [
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
	},
	"gpt-4.1-mini": {
		prices: [
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
	},
	"gpt-4.1-nano": {
		prices: [
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
	},
	"gpt-4o": {
		prices: [
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
	},
	o3: {
		prices: [
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
			{
				validFrom: "2025-06-11T00:00:00Z",
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
	},
	"o4-mini": {
		prices: [
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
	},
};

export const anthropicTokenPricing: ModelPriceTable = {
	// https://www.anthropic.com/pricing
	"claude-4-opus-20250514": {
		prices: [
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
	},
	"claude-4-sonnet-20250514": {
		prices: [
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
	},
	"claude-3-7-sonnet-20250219": {
		prices: [
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
	},
	"claude-3-5-sonnet-20241022": {
		prices: [
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
	},
	"claude-3-5-haiku-20241022": {
		prices: [
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
	},
};

export const googleTokenPricing: ModelPriceTable = {
	// https://ai.google.dev/gemini-api/docs/pricing
	"gemini-2.5-flash": {
		prices: [
			{
				validFrom: "2025-06-01T00:00:00Z",
				price: {
					input: {
						costPerMegaToken: 0.15,
					},
					output: {
						costPerMegaToken: 3.5, // Use price of "thinking" option because we use it when available
						// ref: https://github.com/giselles-ai/giselle/pull/1039#discussion_r2125411214
					},
				},
			},
		],
	},
	"gemini-2.5-flash-lite-preview-06-17": {
		prices: [
			{
				validFrom: "2025-06-18T02:00:00Z",
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
	},
	"gemini-2.5-pro": {
		prices: [
			{
				validFrom: "2025-06-12T02:00:00Z",
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
	},
} as const satisfies Record<GoogleModelId, { prices: ModelPrice[] }>;

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
