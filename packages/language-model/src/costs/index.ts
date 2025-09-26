export type { CostCalculator, CostResultForDisplay } from "./calculator";
export { calculateTokenCostForDisplay } from "./calculator";
export {
	anthropicTokenPricing,
	getValidPricing,
	type ModelPriceTable,
	openAiTokenPricing,
} from "./model-prices";
export * from "./pricing";
export type { ModelTokenUsage } from "./usage";

import { AnthropicCostCalculator } from "../anthropic";
import { GoogleCostCalculator } from "../google";
import { OpenAICostCalculator } from "../openai";
import type { CostCalculator } from "./calculator";
import {
	calculateTokenCostForDisplay,
	DefaultCostCalculator,
} from "./calculator";
import type { EmbeddingModelPriceTable } from "./model-prices";
import {
	cohereEmbeddingPricing,
	getValidEmbeddingPricing,
	googleEmbeddingPricing,
	openAiEmbeddingPricing,
} from "./model-prices";

export function createDisplayCostCalculator(provider: string): CostCalculator {
	switch (provider) {
		case "openai":
			return new OpenAICostCalculator();
		case "anthropic":
			return new AnthropicCostCalculator();
		case "google":
			return new GoogleCostCalculator();
		default:
			console.log(`Unimplemented provider: ${provider}`);
			return new DefaultCostCalculator(provider);
	}
}

export async function calculateDisplayCost(
	provider: string,
	modelId: string,
	usage: { inputTokens: number; outputTokens: number },
) {
	const calculator = createDisplayCostCalculator(provider);
	const result = await calculator.calculate(modelId, {
		inputTokens: usage.inputTokens,
		outputTokens: usage.outputTokens,
		totalTokens: usage.inputTokens + usage.outputTokens,
	});
	return {
		inputCostForDisplay: result.input,
		outputCostForDisplay: result.output,
		totalCostForDisplay: result.total,
	};
}

/**
 * Calculate display cost for embedding operations.
 * Embeddings are priced per token (input only). Output token cost is always 0.
 */
export function calculateEmbeddingDisplayCost(
	provider: "openai" | "google" | "cohere" | string,
	modelId: string,
	usage: { tokens: number; imageTokens?: number },
) {
	try {
		let priceTable: EmbeddingModelPriceTable | undefined;
		switch (provider) {
			case "openai":
				priceTable = openAiEmbeddingPricing;
				break;
			case "google":
				priceTable = googleEmbeddingPricing;
				break;
			case "cohere":
				priceTable = cohereEmbeddingPricing;
				break;
			default:
				priceTable = undefined;
		}

		if (!priceTable) {
			return { totalCostForDisplay: 0 };
		}

		const pricing = getValidEmbeddingPricing(modelId, priceTable);
		let totalCost = 0;
		if (usage.tokens > 0) {
			const textCost = calculateTokenCostForDisplay(
				{
					inputTokens: usage.tokens,
					outputTokens: 0,
					totalTokens: usage.tokens,
				},
				{
					input: { costPerMegaToken: pricing.costPerMegaToken },
					output: { costPerMegaToken: 0 },
				},
			);
			totalCost += textCost.total;
		}
		const imageTokens = usage.imageTokens ?? 0;
		if (imageTokens > 0) {
			const imageCostPerMegaToken =
				pricing.imageCostPerMegaToken ?? pricing.costPerMegaToken;
			const imageCost = calculateTokenCostForDisplay(
				{
					inputTokens: imageTokens,
					outputTokens: 0,
					totalTokens: imageTokens,
				},
				{
					input: { costPerMegaToken: imageCostPerMegaToken },
					output: { costPerMegaToken: 0 },
				},
			);
			totalCost += imageCost.total;
		}
		return { totalCostForDisplay: totalCost };
	} catch (error) {
		console.warn(
			`Embedding pricing not found for provider=${provider}, model=${modelId}.`,
			error instanceof Error ? error.message : String(error),
		);
		return { totalCostForDisplay: 0 };
	}
}
