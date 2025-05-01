import { z } from "zod";
import { Capability, LanguageModelBase, Tier } from "./base";
import type { CostCalculator, CostResult } from "./costs/calculator";
import { calculateTokenCost } from "./costs/calculator";
import {
	getModelPriceFromLangfuse,
	modelPrices,
	perplexityRequestPrices,
	perplexityTokenPrices,
} from "./costs/model-prices";
import type {
	ModelPrice,
	SearchContextSize,
	TokenBasedPricing,
	WebSearchPrice,
} from "./costs/pricing";
import type { TokenUsage } from "./costs/usage";

const PerplexityLanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	presencePenalty: z.number(),
	frequencyPenalty: z.number(),
});
type PerplexityLanguageModelConfigurations = z.infer<
	typeof PerplexityLanguageModelConfigurations
>;

const defaultConfigurations: PerplexityLanguageModelConfigurations = {
	temperature: 0.2,
	topP: 0.9,
	presencePenalty: 0.0,
	frequencyPenalty: 1.0,
};

const PerplexityLanguageModel = LanguageModelBase.extend({
	provider: z.literal("perplexity"),
	configurations: PerplexityLanguageModelConfigurations,
});
type PerplexityLanguageModel = z.infer<typeof PerplexityLanguageModel>;

const sonar: PerplexityLanguageModel = {
	provider: "perplexity",
	id: "sonar",
	capabilities: Capability.TextGeneration && Capability.SearchGrounding,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const sonarPro: PerplexityLanguageModel = {
	provider: "perplexity",
	id: "sonar-pro",
	capabilities: Capability.TextGeneration && Capability.SearchGrounding,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

export const models = [sonar, sonarPro];

export const LanguageModel = PerplexityLanguageModel;
export type LanguageModel = PerplexityLanguageModel;

export class PerplexityCostCalculator implements CostCalculator {
	async calculate(
		model: string,
		toolConfig: any | undefined,
		usage: TokenUsage,
	): Promise<CostResult> {
		let tokenBasedCost = 0;
		let inputCost = 0;
		let outputCost = 0;

		const modelPriceConfig =
			perplexityTokenPrices[model as keyof typeof perplexityTokenPrices];
		// Token-based cost
		const tokenPricing = modelPriceConfig.prices.find(
			(price): price is ModelPrice & { price: TokenBasedPricing } =>
				price.price.type === "token",
		);

		if (tokenPricing) {
			inputCost = calculateTokenCost(
				usage.promptTokens,
				tokenPricing.price.input,
			);
			outputCost = calculateTokenCost(
				usage.completionTokens,
				tokenPricing.price.output,
			);
			tokenBasedCost = inputCost + outputCost;
		}

		// Web-search cost
		let requestBasedCost = 0;
		const webSearchPricing = modelPriceConfig.prices.find(
			(price): price is ModelPrice & { price: WebSearchPrice } =>
				price.price.type === "web_search",
		);

		if (webSearchPricing) {
			const contextSize = (toolConfig?.searchContextSize ||
				"medium") as SearchContextSize;
			requestBasedCost =
				webSearchPricing.price.costPerKiloCalls[contextSize] / 1_000;
		}

		const totalCost = tokenBasedCost + requestBasedCost;

		return {
			input: inputCost,
			output: outputCost,
			total: totalCost,
		};
	}
}
