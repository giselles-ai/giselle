import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";

export const anthropic = {
	"anthropic/claude-opus-4.1": defineLanguageModel({
		provider: "anthropic",
		id: "anthropic/claude-opus-4.1",
		contextWindow: 200_000,
		maxOutputTokens: 32_000,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(15.0),
			output: definePricing(75.0),
		},
		tier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number().min(0).max(1),
			},
			reasoningText: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			reasoningText: false,
		},
		url: "https://www.anthropic.com/claude/opus",
	}),
	"anthropic/claude-sonnet-4-5": defineLanguageModel({
		provider: "anthropic",
		id: "anthropic/claude-sonnet-4-5",
		contextWindow: 200_000,
		maxOutputTokens: 64_000,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
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
			reasoningText: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			reasoningText: false,
		},
		url: "https://www.anthropic.com/claude/sonnet",
	}),
	"anthropic/claude-haiku-4-5": defineLanguageModel({
		provider: "anthropic",
		id: "anthropic/claude-haiku-4-5",
		contextWindow: 200_000,
		maxOutputTokens: 64_000,
		knowledgeCutoff: new Date(2025, 1, 28).getTime(),
		pricing: {
			input: definePricing(1.0),
			output: definePricing(5.0),
		},
		tier: "free",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number(),
			},
			reasoningText: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			reasoningText: false,
		},
		url: "https://www.anthropic.com/claude/haiku",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
