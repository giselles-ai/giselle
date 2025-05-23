import { z } from "zod";
import { Capability, LanguageModelBase, Tier } from "./base";
import {
	BaseCostCalculator,
	type CostCalculator,
	type CostResultForDisplay,
} from "./costs/calculator";
import { googleTokenPricing } from "./costs/model-prices";
import type { ModelTokenUsage } from "./costs/usage";

const GoogleLanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	searchGrounding: z.boolean(),
});
type GoogleLanguageModelConfigurations = z.infer<
	typeof GoogleLanguageModelConfigurations
>;

const defaultConfigurations: GoogleLanguageModelConfigurations = {
	temperature: 0.7,
	topP: 1.0,
	searchGrounding: false,
};

const GoogleLanguageModel = LanguageModelBase.extend({
	provider: z.literal("google"),
	configurations: GoogleLanguageModelConfigurations,
});
type GoogleLanguageModel = z.infer<typeof GoogleLanguageModel>;

const gemini25ProExp: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.5-pro-exp-03-25",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};
const gemini25ProPreview: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.5-pro-preview-03-25",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gemini25FlashPreview: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.5-flash-preview-04-17",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gemini20Flash: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.0-flash",
	capabilities:
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.GenericFileInput,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const gemini20FlashLitePreview: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.0-flash-lite-preview-02-05",
	capabilities: Capability.TextGeneration | Capability.GenericFileInput,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};
const gemini20FlashThinkingExp: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.0-flash-thinking-exp-01-21",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.Reasoning,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};
const gemini20ProExp: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.0-pro-exp-02-05",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.SearchGrounding,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

export const models = [
	gemini25ProExp,
	gemini25ProPreview,
	gemini25FlashPreview,
	gemini20Flash,
	gemini20FlashThinkingExp,
	gemini20ProExp,
];

export const LanguageModel = GoogleLanguageModel;
export type LanguageModel = GoogleLanguageModel;

export class GoogleCostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return googleTokenPricing;
	}
}
