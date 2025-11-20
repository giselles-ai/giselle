import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";

export const google = {
	"google/gemini-2.5-pro": defineLanguageModel({
		provider: "google",
		id: "google/gemini-2.5-pro",
		contextWindow: 2_000_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2024, 1, 1).getTime(), // Dummy
		pricing: {
			input: definePricing(3.5),
			output: definePricing(10.5),
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
			searchGrounding: {
				description: "Whether to use Google Search for grounding.",
				schema: z.boolean(),
			},
			urlContext: {
				description: "Whether to include URL context.",
				schema: z.boolean().optional().default(false),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			topP: 1.0,
			searchGrounding: false,
			urlContext: false,
		},
	}),
	"google/gemini-2.5-flash": defineLanguageModel({
		provider: "google",
		id: "google/gemini-2.5-flash",
		contextWindow: 1_000_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2024, 1, 1).getTime(), // Dummy
		pricing: {
			input: definePricing(0.35),
			output: definePricing(1.05),
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
			searchGrounding: {
				description: "Whether to use Google Search for grounding.",
				schema: z.boolean(),
			},
			urlContext: {
				description: "Whether to include URL context.",
				schema: z.boolean().optional().default(false),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			topP: 1.0,
			searchGrounding: false,
			urlContext: false,
		},
	}),
	"google/gemini-2.5-flash-lite": defineLanguageModel({
		provider: "google",
		id: "google/gemini-2.5-flash-lite",
		contextWindow: 1_000_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2024, 1, 1).getTime(), // Dummy
		pricing: {
			input: definePricing(0.15),
			output: definePricing(0.45),
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
			searchGrounding: {
				description: "Whether to use Google Search for grounding.",
				schema: z.boolean(),
			},
			urlContext: {
				description: "Whether to include URL context.",
				schema: z.boolean().optional().default(false),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			topP: 1.0,
			searchGrounding: false,
			urlContext: false,
		},
	}),
} as const satisfies Record<string, AnyLanguageModel>;
