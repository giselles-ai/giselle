import { z } from "zod";
import { Capability, LanguageModelBase, Tier } from "./base";
import type { CostCalculator, CostResult } from "./costs/calculator";
import { calculateTokenCost, ToolConfig } from "./costs/calculator";
import { getModelPriceFromLangfuse, modelPrices } from "./costs/model-prices";
import type { Cost } from "./costs/pricing";
import type { SearchContextSize } from "./costs/pricing";
import type { TokenBasedPrice, TokenBasedPricing } from "./costs/pricing";
import type { ApiCallUsage, TokenUsage } from "./costs/usage";

const OpenAILanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	presencePenalty: z.number(),
	frequencyPenalty: z.number(),
});
type OpenAILanguageModelConfigurations = z.infer<
	typeof OpenAILanguageModelConfigurations
>;

const defaultConfigurations: OpenAILanguageModelConfigurations = {
	temperature: 0.7,
	topP: 1.0,
	presencePenalty: 0.0,
	frequencyPenalty: 0.0,
};

const OpenAILanguageModel = LanguageModelBase.extend({
	provider: z.literal("openai"),
	configurations: OpenAILanguageModelConfigurations,
});
type OpenAILanguageModel = z.infer<typeof OpenAILanguageModel>;

/**
 * OpenAI specific tool configuration
 */
export interface OpenAIToolConfig extends ToolConfig {
	openaiWebSearch?: {
		webSearchCalls: number;
		searchContextSize?: SearchContextSize;
	};
}

export class OpenAICostCalculator implements CostCalculator<OpenAIToolConfig, TokenUsage> {
	async calculate(
		model: string,
		toolConfig: OpenAIToolConfig,
		usage: TokenUsage,
	): Promise<CostResult> {
		const tokenCost = await this.calculateTokenCost(model, usage);

		if (toolConfig?.openaiWebSearch?.webSearchCalls) {
			const webSearchUsage: ApiCallUsage = {
				calls: toolConfig.openaiWebSearch.webSearchCalls,
			};
			const webSearchCost = this.calculateWebSearchCost(model, webSearchUsage);

			return {
				input: tokenCost.input + webSearchCost.input,
				output: tokenCost.output + webSearchCost.output,
				total: tokenCost.total + webSearchCost.total,
			};
		}

		return tokenCost;
	}

	private async calculateTokenCost(model: string, usage: TokenUsage): Promise<CostResult> {
		const pricing = await getModelPriceFromLangfuse(model);

		const inputCost = calculateTokenCost(usage.promptTokens, pricing.input);
		const outputCost = calculateTokenCost(
			usage.completionTokens,
			pricing.output,
		);

		return {
			input: inputCost,
			output: outputCost,
			total: inputCost + outputCost,
		};
	}

	private calculateWebSearchCost(
		model: string,
		usage: ApiCallUsage,
	): CostResult {
		const costPerCall = 0.002; // $0.002 per web search call
		const inputCost = usage.calls * costPerCall;

		return {
			input: inputCost,
			output: 0,
			total: inputCost,
		};
	}
}

const gpt4o: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4o",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt4oMini: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4o-mini",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const o1Preview: OpenAILanguageModel = {
	provider: "openai",
	id: "o1-preview",
	capabilities: Capability.TextGeneration,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const o1Mini: OpenAILanguageModel = {
	provider: "openai",
	id: "o1-mini",
	capabilities: Capability.TextGeneration,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const o3: OpenAILanguageModel = {
	provider: "openai",
	id: "o3",
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const o3Mini: OpenAILanguageModel = {
	provider: "openai",
	id: "o3-mini",
	capabilities: Capability.TextGeneration,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const o4Mini: OpenAILanguageModel = {
	provider: "openai",
	id: "o4-mini",
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt41: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4.1",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt41mini: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4.1-mini",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt41nano: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4.1-nano",
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

export const models = [
	gpt4o,
	gpt4oMini,
	o3,
	o3Mini,
	o4Mini,
	gpt41,
	gpt41mini,
	gpt41nano,
];

export const LanguageModel = OpenAILanguageModel;
export type LanguageModel = OpenAILanguageModel;
