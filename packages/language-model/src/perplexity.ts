import { z } from "zod/v4";
import { Capability, LanguageModelBase, Tier } from "./base";

const PerplexityLanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
	presencePenalty: z.number(),
	frequencyPenalty: z.number(),
	searchDomainFilter: z.array(z.string()).optional(),
});
type PerplexityLanguageModelConfigurations = z.infer<
	typeof PerplexityLanguageModelConfigurations
>;

const defaultConfigurations: PerplexityLanguageModelConfigurations = {
	temperature: 0.2,
	topP: 0.9,
	presencePenalty: 0.0,
	frequencyPenalty: 1.0,
};

const PerplexityLanguageModel = LanguageModelBase.extend({
	provider: z.literal("perplexity"),
	configurations: PerplexityLanguageModelConfigurations,
});
type PerplexityLanguageModel = z.infer<typeof PerplexityLanguageModel>;

const sonar: PerplexityLanguageModel = {
	provider: "perplexity",
	id: "sonar",
	capabilities: Capability.TextGeneration && Capability.SearchGrounding,
	tier: Tier.enum.free,
	configurations: defaultConfigurations,
};

const sonarPro: PerplexityLanguageModel = {
	provider: "perplexity",
	id: "sonar-pro",
	capabilities: Capability.TextGeneration && Capability.SearchGrounding,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

export const models = [sonar, sonarPro];

export const LanguageModel = PerplexityLanguageModel;
export type LanguageModel = PerplexityLanguageModel;
