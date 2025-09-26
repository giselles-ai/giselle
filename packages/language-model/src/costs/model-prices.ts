import type { LanguageModel as GoogleTextLanguageModel } from "../google";
import type { LanguageModel as GoogleImageLanguageModel } from "../google-image";
import type { ModelPrice } from "./pricing";

export type ModelPriceTable = Record<string, { prices: ModelPrice[] }>;

type GoogleModelId =
	| GoogleTextLanguageModel["id"]
	| GoogleImageLanguageModel["id"];

export const openAiTokenPricing: ModelPriceTable = {
	// https://platform.openai.com/docs/pricing#latest-models
	"gpt-5": {
		prices: [
			{
				validFrom: "2025-08-08T00:00:00Z",
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
	"gpt-5-codex": {
		prices: [
			{
				validFrom: "2025-09-15T00:00:00Z",
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
	"gpt-5-mini": {
		prices: [
			{
				validFrom: "2025-08-08T00:00:00Z",
				price: {
					input: {
						costPerMegaToken: 0.25,
					},
					output: {
						costPerMegaToken: 2.0,
					},
				},
			},
		],
	},
	"gpt-5-nano": {
		prices: [
			{
				validFrom: "2025-08-08T00:00:00Z",
				price: {
					input: {
						costPerMegaToken: 0.05,
					},
					output: {
						costPerMegaToken: 0.4,
					},
				},
			},
		],
	},
};

export const anthropicTokenPricing: ModelPriceTable = {
	// https://www.anthropic.com/pricing
	"claude-opus-4-1-20250805": {
		prices: [
			{
				validFrom: "2025-08-06T00:00:00Z",
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
	"gemini-2.5-flash-lite": {
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
	"gemini-2.5-flash-image-preview": {
		prices: [
			{
				validFrom: "2025-09-12T00:00:00Z",
				price: {
					input: { costPerMegaToken: 0.3 },
					output: { costPerMegaToken: 30.0 },
				},
			},
		],
	},
} satisfies Record<GoogleModelId, { prices: ModelPrice[] }>;

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

/**
 * Embedding model pricing
 * Embeddings charge per input token only (no output distinction)
 */
type EmbeddingModelPrice = {
	validFrom: string;
	costPerMegaToken: number; // USD per 1,000,000 tokens (text tokens)
	imageCostPerMegaToken?: number; // USD per 1,000,000 tokens (image tokens)
};

export type EmbeddingModelPriceTable = Record<
	string,
	{ prices: EmbeddingModelPrice[] }
>;

export function getValidEmbeddingPricing(
	modelId: string,
	priceTable: EmbeddingModelPriceTable,
): EmbeddingModelPrice {
	const modelPricing = priceTable[modelId];
	if (!modelPricing) {
		throw new Error(`No embedding pricing found for model ${modelId}`);
	}

	const now = new Date();
	const validPrices = modelPricing.prices
		.filter((price) => new Date(price.validFrom) <= now)
		.sort(
			(a, b) =>
				new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime(),
		);

	if (validPrices.length === 0) {
		throw new Error(`No valid embedding pricing found for model ${modelId}`);
	}

	return validPrices[0];
}

// Embedding pricing tables (per 1M tokens)
// validFrom is unified per request
export const openAiEmbeddingPricing: EmbeddingModelPriceTable = {
	"text-embedding-3-small": {
		prices: [
			{
				validFrom: "2025-08-28T00:00:00Z",
				costPerMegaToken: 0.01,
			},
		],
	},
	"text-embedding-3-large": {
		prices: [
			{
				validFrom: "2025-08-28T00:00:00Z",
				costPerMegaToken: 0.065,
			},
		],
	},
};

export const googleEmbeddingPricing: EmbeddingModelPriceTable = {
	"gemini-embedding-001": {
		prices: [
			{
				validFrom: "2025-08-28T00:00:00Z",
				costPerMegaToken: 0.15,
			},
		],
	},
};

export const cohereEmbeddingPricing: EmbeddingModelPriceTable = {
	"embed-4": {
		prices: [
			{
				validFrom: "2025-09-26T00:00:00Z",
				costPerMegaToken: 0.12,
				imageCostPerMegaToken: 0.47,
			},
		],
	},
};
