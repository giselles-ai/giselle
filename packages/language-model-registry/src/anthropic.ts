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
		name: "Claude Opus 4.1",
		description:
			"Claude Opus 4.1 is a drop-in replacement for Opus 4 that delivers superior performance and precision for real-world coding and agentic tasks. Opus 4.1 advances state-of-the-art coding performance to 74.5% on SWE-bench Verified, and handles complex, multi-step problems with more rigor and attention to detail.",
		contextWindow: 200_000,
		maxOutputTokens: 32_000,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(15.0),
			output: definePricing(75.0),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number().min(0).max(1),
				ui: {
					step: 0.1,
				},
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
		name: "Claude Sonnet 4.5",
		description:
			"Claude Sonnet 4.5 is the newest model in the Sonnet series, offering improvements and updates over Sonnet 4.",
		contextWindow: 200_000,
		maxOutputTokens: 64_000,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(3.0),
			output: definePricing(15.0),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number(),
				ui: {
					step: 0.1,
				},
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
		name: "Claude Haiku 4.5",
		description:
			"Claude Haiku 4.5 matches Sonnet 4's performance on coding, computer use, and agent tasks at substantially lower cost and faster speeds. It delivers near-frontier performance and Claude’s unique character at a price point that works for scaled sub-agent deployments, free tier products, and intelligence-sensitive applications with budget constraints.",
		contextWindow: 200_000,
		maxOutputTokens: 64_000,
		knowledgeCutoff: new Date(2025, 1, 28).getTime(),
		pricing: {
			input: definePricing(1.0),
			output: definePricing(5.0),
		},
		requiredTier: "free",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number(),
				ui: {
					step: 0.1,
				},
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
