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
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		tier: "pro",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
			},
			searchGrounding: {
				description: "Whether to use Google Search for grounding.",
				schema: z.boolean(),
			},
			urlContext: {
				description: "Whether to include URL context.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			searchGrounding: false,
			urlContext: false,
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
	"google/gemini-2.5-flash": defineLanguageModel({
		provider: "google",
		id: "google/gemini-2.5-flash",
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(0.1),
			output: definePricing(0.4),
		},
		tier: "pro",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
			},
			searchGrounding: {
				description: "Whether to use Google Search for grounding.",
				schema: z.boolean(),
			},
			urlContext: {
				description: "Whether to include URL context.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			searchGrounding: false,
			urlContext: false,
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
	"google/gemini-2.5-flash-lite": defineLanguageModel({
		provider: "google",
		id: "google/gemini-2.5-flash-lite",
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(0.1),
			output: definePricing(0.4),
		},
		tier: "free",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
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
			searchGrounding: false,
			urlContext: false,
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
