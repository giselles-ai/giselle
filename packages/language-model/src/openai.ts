import { z } from "zod";
import { Capability, LanguageModelBase, Tier } from "./base";

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
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
	tier: Tier.enum.plus,
	configurations: defaultConfigurations,
};

const gpt4oMini: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-4o-mini",
	capabilities: Capability.ImageFileInput | Capability.TextGeneration,
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

const o3Mini: OpenAILanguageModel = {
	provider: "openai",
	id: "o3mini",
	capabilities: Capability.TextGeneration,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

export const models = [gpt4o, gpt4oMini, o3Mini];

export const LanguageModel = OpenAILanguageModel;
export type LanguageModel = OpenAILanguageModel;
