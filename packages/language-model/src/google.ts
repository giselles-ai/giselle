import { z } from "zod";
import { Capability, LanguageModelBase, Tier } from "./base";

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
		Capability.SearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const gemini20Flash: GoogleLanguageModel = {
	provider: "google",
	id: "gemini-2.0-flash-001",
	capabilities:
		Capability.TextGeneration |
		Capability.SearchGrounding |
		Capability.GenericFileInput,
	tier: Tier.enum.pro,
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
	gemini20Flash,
	gemini20FlashThinkingExp,
	gemini20ProExp,
];

export const LanguageModel = GoogleLanguageModel;
export type LanguageModel = GoogleLanguageModel;
