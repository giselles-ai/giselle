import { z } from "zod";
import { Capability, LanguageModelBase, Tier } from "./base";
import type { CostCalculator, CostResult } from "./costs/calculator";
import { calculateTokenCost, ToolConfig } from "./costs/calculator";
import { getModelPriceFromLangfuse } from "./costs/model-prices";
import type { TokenBasedPricing } from "./costs/pricing";
import type { TokenUsage } from "./costs/usage";

const AnthropicLanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	reasoning: z.boolean().default(false),
});
type AnthropicLanguageModelConfigurations = z.infer<
	typeof AnthropicLanguageModelConfigurations
>;

const defaultConfigurations: AnthropicLanguageModelConfigurations = {
	temperature: 0.7,
	topP: 1.0,
	reasoning: false,
};

const AnthropicLanguageModel = LanguageModelBase.extend({
	provider: z.literal("anthropic"),
	configurations: AnthropicLanguageModelConfigurations,
});
type AnthropicLanguageModel = z.infer<typeof AnthropicLanguageModel>;

const claude37Sonnet: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-3-7-sonnet-20250219",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.Reasoning |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};
const claude35Sonnet: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-3-5-sonnet-20241022",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};
const claude35Haiku: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-3-5-haiku-20241022",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.ImageFileInput,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

export class AnthropicCostCalculator implements CostCalculator<ToolConfig, TokenUsage> {
	async calculate(
		model: string,
		_toolConfig: ToolConfig,
		usage: TokenUsage,
	): Promise<CostResult> {
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
}

export const models = [claude37Sonnet, claude35Sonnet, claude35Haiku];

export const LanguageModel = AnthropicLanguageModel;
export type LanguageModel = AnthropicLanguageModel;
