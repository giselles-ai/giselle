import { z } from "zod/v4";
import { Capability, LanguageModelBase, Tier } from "./base";
import { BaseCostCalculator } from "./costs/calculator";
import { googleTokenPricing } from "./costs/model-prices";

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

export const GoogleLanguageModelId = z
	.enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"])
	.catch((ctx) => {
		if (typeof ctx.value !== "string") {
			return "gemini-2.5-flash-lite";
		}
		if (/^gemini-\d+(?:\.\d+)?-pro/.test(ctx.value)) {
			return "gemini-2.5-pro";
		}
		if (/^gemini-\d+(?:\.\d+)?-flash-lite/.test(ctx.value)) {
			return "gemini-2.5-flash-lite";
		}
		if (/^gemini-\d+(?:\.\d+)?-flash/.test(ctx.value)) {
			return "gemini-2.5-flash";
		}
		return "gemini-2.5-flash-lite";
	});

const GoogleLanguageModel = LanguageModelBase.extend({
	id: GoogleLanguageModelId,
	provider: z.literal("google"),
	configurations: GoogleLanguageModelConfigurations,
});
type GoogleLanguageModel = z.infer<typeof GoogleLanguageModel>;

const gemini25Pro: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.5-pro",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.OptionalSearchGrounding |
		Capability.UrlContext |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gemini25Flash: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.5-flash",
	capabilities:
		Capability.TextGeneration |
		Capability.GenericFileInput |
		Capability.OptionalSearchGrounding |
		Capability.UrlContext |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gemini25FlashLite: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.5-flash-lite",
	capabilities:
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.UrlContext |
		Capability.GenericFileInput,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

export const models = [gemini25Pro, gemini25Flash, gemini25FlashLite];

export const LanguageModel = GoogleLanguageModel;
export type LanguageModel = GoogleLanguageModel;

export class GoogleCostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return googleTokenPricing;
	}
}
