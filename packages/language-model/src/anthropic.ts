import * as z from "zod/v4";
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
		"claude-opus-4.5",
		"claude-opus-4-1-20250805",
		"claude-sonnet-4-5-20250929",
		"claude-haiku-4-5-20251001",
	])
	.catch((ctx) => {
		if (typeof ctx.value !== "string") {
			return "claude-haiku-4-5-20251001";
		}
		const v = ctx.value;
		if (/^claude-opus-4[.-]5(?:-.+)?$/.test(v)) {
			return "claude-opus-4.5";
		}
		if (/^claude-4[.-]5-opus-/.test(v)) {
			return "claude-opus-4.5";
		}
		if (/^claude-opus-4-1-/.test(v)) {
			return "claude-opus-4-1-20250805";
		}
		if (/^claude-4-opus-/.test(v)) {
			return "claude-opus-4-1-20250805";
		}
		if (/^claude-sonnet-4-5-/.test(v)) {
			return "claude-sonnet-4-5-20250929";
		}
		if (/^claude-4-sonnet-/.test(v)) {
			return "claude-sonnet-4-5-20250929";
		}
		if (/^claude-3-7-sonnet-/.test(v)) {
			return "claude-sonnet-4-5-20250929";
		}
		if (/^claude-haiku-4-5-/.test(v)) {
			return "claude-haiku-4-5-20251001";
		}
		if (/^claude-3-5-haiku-/.test(v)) {
			return "claude-haiku-4-5-20251001";
		}
		if (/^claude-3-5-sonnet-/.test(v)) {
			return "claude-sonnet-4-5-20250929";
		}
		if (/^claude-3-sonnet-/.test(v)) {
			return "claude-sonnet-4-5-20250929";
		}
		if (/^claude-3-opus-/.test(v)) {
			return "claude-opus-4-1-20250805";
		}
		if (/^claude-3-haiku-/.test(v)) {
			return "claude-haiku-4-5-20251001";
		}
		return "claude-haiku-4-5-20251001";
	});

const AnthropicLanguageModel = LanguageModelBase.extend({
	id: AnthropicLanguageModelId,
	provider: z.literal("anthropic"),
	configurations: AnthropicLanguageModelConfigurations,
});
type AnthropicLanguageModel = z.infer<typeof AnthropicLanguageModel>;

const claude45Opus: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-opus-4.5",
	capabilities:
		Capability.TextGeneration |
		Capability.Reasoning |
		Capability.PdfFileInput |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const claude45Haiku: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-haiku-4-5-20251001",
	capabilities:
		Capability.TextGeneration |
		Capability.Reasoning |
		Capability.PdfFileInput |
		Capability.ImageFileInput,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const claude45Sonnet: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-sonnet-4-5-20250929",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.Reasoning |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const claude41Opus: AnthropicLanguageModel = {
	provider: "anthropic",
	id: "claude-opus-4-1-20250805",
	capabilities:
		Capability.TextGeneration |
		Capability.PdfFileInput |
		Capability.Reasoning |
		Capability.ImageFileInput,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

export const models = [
	claude45Opus,
	claude41Opus,
	claude45Sonnet,
	claude45Haiku,
];

export const LanguageModel = AnthropicLanguageModel;
export type LanguageModel = AnthropicLanguageModel;

export class AnthropicCostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return anthropicTokenPricing;
	}
}
