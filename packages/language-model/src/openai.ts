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

const OpenAILanguageModel = LanguageModelBase.extend({
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

export class OpenAICostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return openAiTokenPricing;
	}
}
