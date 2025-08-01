import { z } from "zod/v4";
import { Capability, LanguageModelBase, Tier } from "./base";
import { BaseCostCalculator } from "./costs/calculator";
import { anthropicTokenPricing } from "./costs/model-prices";

const AnthropicLanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	reasoningText: z.boolean().default(false),
});
type AnthropicLanguageModelConfigurations = z.infer<
	typeof AnthropicLanguageModelConfigurations
>;

const defaultConfigurations: AnthropicLanguageModelConfigurations = {
	temperature: 0.7,
	topP: 1.0,
	reasoningText: false,
};

export const AnthropicLanguageModelId = z
	.enum([
		"claude-4-opus-20250514",
		"claude-4-sonnet-20250514",
		"claude-3-7-sonnet-20250219",
		"claude-3-5-haiku-20241022",
	])
	.catch((ctx) => {
		if (typeof ctx.value !== "string") {
			return "claude-3-5-haiku-20241022";
		}
		const v = ctx.value;
		if (/^claude-4-opus-4-/.test(v)) {
			return "claude-4-opus-20250514";
		}
		if (/^claude-4-sonnet-4-/.test(v)) {
			return "claude-4-sonnet-20250514";
		}
		if (/^claude-3-7-sonnet-/.test(v)) {
			return "claude-3-7-sonnet-20250219";
		}
		if (/^claude-3-5-haiku-/.test(v)) {
			return "claude-3-5-haiku-20241022";
		}
		if (/^claude-3-5-sonnet-/.test(v)) {
			return "claude-3-7-sonnet-20250219";
		}
		if (/^claude-3-opus-/.test(v)) {
			return "claude-4-opus-20250514";
		}
		if (/^claude-3-sonnet-/.test(v)) {
			return "claude-3-7-sonnet-20250219";
		}
		if (/^claude-3-haiku-/.test(v)) {
			return "claude-3-5-haiku-20241022";
		}
		return "claude-3-5-haiku-20241022";
	});

const AnthropicLanguageModel = LanguageModelBase.extend({
	id: AnthropicLanguageModelId,
	provider: z.literal("anthropic"),
	configurations: AnthropicLanguageModelConfigurations,
});
type AnthropicLanguageModel = z.infer<typeof AnthropicLanguageModel>;

const claude40Opus: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-4-opus-20250514",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.Reasoning |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const claude40Sonnet: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-4-sonnet-20250514",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.Reasoning |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

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

export const models = [
	claude40Opus,
	claude40Sonnet,
	claude37Sonnet,
	claude35Haiku,
];

export const LanguageModel = AnthropicLanguageModel;
export type LanguageModel = AnthropicLanguageModel;

export class AnthropicCostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return anthropicTokenPricing;
	}
}
