import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";

export const anthropic = {
	"anthropic/claude-opus-4-1-20250805": defineLanguageModel({
		provider: "anthropic",
		id: "anthropic/claude-opus-4-1-20250805",
		contextWindow: 200_000,
		maxOutputTokens: 4_096,
		knowledgeCutoff: new Date(2024, 3, 1).getTime(), // Dummy
		pricing: {
			input: definePricing(15.0),
			output: definePricing(75.0),
		},
		tier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number(),
			},
			topP: {
				description:
					"Use nucleus sampling. In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top_p.",
				schema: z.number(),
			},
			reasoningText: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean().default(false),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			topP: 1.0,
			reasoningText: false,
		},
	}),
	"anthropic/claude-sonnet-4-5-20250929": defineLanguageModel({
		provider: "anthropic",
		id: "anthropic/claude-sonnet-4-5-20250929",
		contextWindow: 200_000,
		maxOutputTokens: 4_096,
		knowledgeCutoff: new Date(2024, 3, 1).getTime(), // Dummy
		pricing: {
			input: definePricing(3.0),
			output: definePricing(15.0),
		},
		tier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number(),
			},
			topP: {
				description:
					"Use nucleus sampling. In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top_p.",
				schema: z.number(),
			},
			reasoningText: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean().default(false),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			topP: 1.0,
			reasoningText: false,
		},
	}),
	"anthropic/claude-haiku-4-5-20251001": defineLanguageModel({
		provider: "anthropic",
		id: "anthropic/claude-haiku-4-5-20251001",
		contextWindow: 200_000,
		maxOutputTokens: 4_096,
		knowledgeCutoff: new Date(2024, 3, 1).getTime(), // Dummy
		pricing: {
			input: definePricing(0.25),
			output: definePricing(1.25),
		},
		tier: "free",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number(),
			},
			topP: {
				description:
					"Use nucleus sampling. In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top_p.",
				schema: z.number(),
			},
			reasoningText: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean().default(false),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			topP: 1.0,
			reasoningText: false,
		},
	}),
} as const satisfies Record<string, AnyLanguageModel>;
