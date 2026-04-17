import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
	type LanguageModelProviderDefinition,
} from "./language-model";

const minimaxProvider = {
	id: "minimax",
	title: "MiniMax",
	metadata: {
		website: "https://www.minimax.io",
		documentationUrl: "https://platform.minimaxi.com/document/",
	},
} as const satisfies LanguageModelProviderDefinition<"minimax">;

export const minimax = {
	"minimax/MiniMax-M2.7": defineLanguageModel({
		provider: minimaxProvider,
		id: "minimax/MiniMax-M2.7",
		name: "MiniMax M2.7",
		description:
			"MiniMax M2.7 is MiniMax's latest flagship model with 204K context window, offering strong performance in reasoning, coding, and multilingual tasks.",
		contextWindow: 204_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2025, 0, 1).getTime(),
		pricing: {
			input: definePricing(0.8),
			output: definePricing(2.4),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description:
					"Amount of randomness injected into the response. Must be greater than 0 and at most 1.",
				schema: z.number().min(0.01).max(1.0),
				ui: {
					min: 0.01,
					max: 1.0,
					step: 0.01,
				},
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
		},
		url: "https://platform.minimaxi.com/document/",
	}),
	"minimax/MiniMax-M2.7-highspeed": defineLanguageModel({
		provider: minimaxProvider,
		id: "minimax/MiniMax-M2.7-highspeed",
		name: "MiniMax M2.7 Highspeed",
		description:
			"MiniMax M2.7 Highspeed is an optimized variant of M2.7 for faster inference with 204K context window, ideal for latency-sensitive applications.",
		contextWindow: 204_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2025, 0, 1).getTime(),
		pricing: {
			input: definePricing(0.6),
			output: definePricing(1.8),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description:
					"Amount of randomness injected into the response. Must be greater than 0 and at most 1.",
				schema: z.number().min(0.01).max(1.0),
				ui: {
					min: 0.01,
					max: 1.0,
					step: 0.01,
				},
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
		},
		url: "https://platform.minimaxi.com/document/",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
