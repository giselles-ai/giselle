import type { ModelPrice } from "./pricing";

export type ModelPriceTable = Record<string, { prices: ModelPrice[] }>;

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
	"gpt-4o-mini": {
		prices: [
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
		],
	},
	"o3-mini": {
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
