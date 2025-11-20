import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";

export const perplexity = {
	"perplexity/sonar": defineLanguageModel({
		provider: "perplexity",
		id: "perplexity/sonar",
		contextWindow: 127_072,
		maxOutputTokens: 4_096,
		knowledgeCutoff: Date.now(), // Real-time
		pricing: {
			input: definePricing(1.0),
			output: definePricing(1.0),
		},
		tier: "free",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number(),
			},
			topP: {
				description:
					"The maximum cumulative probability of tokens to consider when sampling.",
				schema: z.number(),
			},
			presencePenalty: {
				description:
					"Positive values penalize new tokens based on whether they appear in the text so far.",
				schema: z.number(),
			},
			frequencyPenalty: {
				description:
					"Positive values penalize new tokens based on their existing frequency in the text so far.",
				schema: z.number(),
			},
			searchDomainFilter: {
				description: "List of domains to limit the search to.",
				schema: z.array(z.string()).optional(),
			},
		},
		defaultConfiguration: {
			temperature: 0.2,
			topP: 0.9,
			presencePenalty: 0.0,
			frequencyPenalty: 1.0,
		},
	}),
	"perplexity/sonar-pro": defineLanguageModel({
		provider: "perplexity",
		id: "perplexity/sonar-pro",
		contextWindow: 127_072,
		maxOutputTokens: 4_096,
		knowledgeCutoff: Date.now(), // Real-time
		pricing: {
			input: definePricing(3.0),
			output: definePricing(15.0),
		},
		tier: "pro",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number(),
			},
			topP: {
				description:
					"The maximum cumulative probability of tokens to consider when sampling.",
				schema: z.number(),
			},
			presencePenalty: {
				description:
					"Positive values penalize new tokens based on whether they appear in the text so far.",
				schema: z.number(),
			},
			frequencyPenalty: {
				description:
					"Positive values penalize new tokens based on their existing frequency in the text so far.",
				schema: z.number(),
			},
			searchDomainFilter: {
				description: "List of domains to limit the search to.",
				schema: z.array(z.string()).optional(),
			},
		},
		defaultConfiguration: {
			temperature: 0.2,
			topP: 0.9,
			presencePenalty: 0.0,
			frequencyPenalty: 1.0,
		},
	}),
} as const satisfies Record<string, AnyLanguageModel>;
