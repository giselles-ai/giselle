import * as z from "zod/v4";
import { Capability, LanguageModelBase, Tier } from "./base";
import { openAiTokenPricing } from "./costs";
import { BaseCostCalculator } from "./costs/calculator";

const OpenAILanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	presencePenalty: z.number(),
	frequencyPenalty: z.number(),
	textVerbosity: z.enum(["low", "medium", "high"]).optional().default("medium"),
	reasoningEffort: z
		.enum(["minimal", "low", "medium", "high"])
		.optional()
		.default("medium"),
});
type OpenAILanguageModelConfigurations = z.infer<
	typeof OpenAILanguageModelConfigurations
>;

const defaultConfigurations: OpenAILanguageModelConfigurations = {
	temperature: 0.7,
	topP: 1.0,
	presencePenalty: 0.0,
	frequencyPenalty: 0.0,
	textVerbosity: "medium",
	reasoningEffort: "medium",
};

export const OpenAILanguageModelId = z
	.enum([
		"gpt-5.2",
		"gpt-5.1-thinking",
		"gpt-5.1-codex",
		"gpt-5",
		"gpt-5-mini",
		"gpt-5-nano",
	])
	.catch((ctx) => {
		if (typeof ctx.value !== "string") {
			return "gpt-5-nano";
		}
		const v = ctx.value;

		if (/^gpt-5\.2(?:-.+)?$/.test(v)) {
			return "gpt-5.2";
		}

		if (/^gpt-5\.1-thinking(?:-.+)?$/.test(v)) {
			return "gpt-5.1-thinking";
		}

		if (/^gpt-5\.1-codex(?:-.+)?$/.test(v)) {
			return "gpt-5.1-codex";
		}

		if (/^gpt-5-codex(?:-.+)?$/.test(v)) {
			return "gpt-5.1-codex";
		}

		// Fallback to gpt-5
		if (
			v === "gpt-4o" ||
			v === "o3" ||
			v === "gpt-4.1" ||
			v === "o1" ||
			v === "gpt-4-turbo" ||
			v === "gpt-4" ||
			v === "gpt-3.5-turbo"
		) {
			return "gpt-5";
		}

		// Fallback to gpt-5-mini
		if (
			v === "o4-mini" ||
			v === "gpt-4.1-mini" ||
			v === "o3-mini" ||
			v === "o1-mini" ||
			v === "gpt-4o-mini"
		) {
			return "gpt-5-mini";
		}

		// Fallback to gpt-5-nano
		if (v === "gpt-4.1-nano") {
			return "gpt-5-nano";
		}

		return "gpt-5-nano";
	});

const OpenAILanguageModel = LanguageModelBase.extend({
	id: OpenAILanguageModelId,
	provider: z.literal("openai"),
	configurations: OpenAILanguageModelConfigurations,
});
type OpenAILanguageModel = z.infer<typeof OpenAILanguageModel>;

const gpt52: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-5.2",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt51Thinking: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-5.1-thinking",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt51codex: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-5.1-codex",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt5: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-5",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt5mini: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-5-mini",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.OptionalSearchGrounding |
		Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const gpt5nano: OpenAILanguageModel = {
	provider: "openai",
	id: "gpt-5-nano",
	capabilities:
		Capability.ImageFileInput |
		Capability.TextGeneration |
		Capability.Reasoning,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

export const models = [
	gpt52,
	gpt51Thinking,
	gpt51codex,
	gpt5,
	gpt5mini,
	gpt5nano,
];

export const LanguageModel = OpenAILanguageModel;
export type LanguageModel = OpenAILanguageModel;

export class OpenAICostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return openAiTokenPricing;
	}
}
