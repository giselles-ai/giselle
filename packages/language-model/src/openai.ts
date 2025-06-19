import { z } from "zod/v4";
import { Capability, LanguageModelBase, Tier } from "./base";
import { openAiTokenPricing } from "./costs";
import { BaseCostCalculator } from "./costs/calculator";

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

export const OpenAILanguageModelId = z
	.enum(["gpt-4o", "o3", "o4-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"])
	.catch((ctx) => {
		if (typeof ctx.value !== "string") {
			return "gpt-4.1-nano";
		}
		const v = ctx.value;
		if (v === "o1") {
			return "o3";
		}
		if (v === "o3-mini" || v === "o1-mini") {
			return "o4-mini";
		}
		if (v === "gpt-4o-mini") {
			return "gpt-4.1-mini";
		}
		if (v === "gpt-4-turbo" || v === "gpt-4" || v === "gpt-3.5-turbo") {
			return "gpt-4o";
		}
		return "gpt-4.1-nano";
	});

const OpenAILanguageModel = LanguageModelBase.extend({
	id: OpenAILanguageModelId,
	provider: z.literal("openai"),
	configurations: OpenAILanguageModelConfigurations,
});
type OpenAILanguageModel = z.infer<typeof OpenAILanguageModel>;

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

const o3: OpenAILanguageModel = {
	provider: "openai",
	id: "o3",
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
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
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const gpt41nano: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4.1-nano",
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

export const models = [gpt4o, o3, o4Mini, gpt41, gpt41mini, gpt41nano];

export const LanguageModel = OpenAILanguageModel;
export type LanguageModel = OpenAILanguageModel;

export class OpenAICostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return openAiTokenPricing;
	}
}
