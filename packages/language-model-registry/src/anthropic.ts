import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
	type LanguageModelProviderDefinition,
} from "./language-model";

const anthropicProvider = {
	id: "anthropic",
	title: "Anthropic",
	metadata: {
		website: "https://www.anthropic.com/",
		documentationUrl: "https://platform.claude.com/docs/en/api/overview",
	},
} as const satisfies LanguageModelProviderDefinition<"anthropic">;

export const anthropic = {
	"anthropic/claude-opus-4.6": defineLanguageModel({
		provider: anthropicProvider,
		id: "anthropic/claude-opus-4.6",
		name: "Claude Opus 4.6",
		description:
			"Claude Opus 4.6 is Anthropic's most intelligent model, offering industry-leading performance in coding, agentic tasks, and complex reasoning with a 128K max output.",
		contextWindow: 200_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2025, 4, 31).getTime(),
		pricing: {
			input: definePricing(5.0),
			output: definePricing(25.0),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number().min(0).max(1),
				ui: {
					min: 0.0,
					max: 1.0,
					step: 0.1,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinking: false,
		},
		url: "https://www.anthropic.com/claude/opus",
	}),
	"anthropic/claude-opus-4.5": defineLanguageModel({
		provider: anthropicProvider,
		id: "anthropic/claude-opus-4.5",
		name: "Claude Opus 4.5",
		description:
			"Claude Opus 4.5 is Anthropic’s latest model in the Opus series, meant for demanding reasoning tasks and complex problem solving. ",
		contextWindow: 200_000,
		maxOutputTokens: 64_000,
		knowledgeCutoff: new Date(2025, 2, 31).getTime(),
		pricing: {
			input: definePricing(5.0),
			output: definePricing(25.0),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Amount of randomness injected into the response.",
				schema: z.number().min(0).max(1),
				ui: {
					min: 0.0,
					max: 1.0,
					step: 0.1,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinking: false,
		},
		url: "https://www.anthropic.com/claude/opus",
	}),
	"anthropic/claude-sonnet-4.5": defineLanguageModel({
		provider: anthropicProvider,
		id: "anthropic/claude-sonnet-4.5",
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
					min: 0.0,
					max: 1.0,
					step: 0.1,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinking: false,
		},
		url: "https://www.anthropic.com/claude/sonnet",
	}),
	"anthropic/claude-haiku-4.5": defineLanguageModel({
		provider: anthropicProvider,
		id: "anthropic/claude-haiku-4.5",
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
					min: 0.0,
					max: 1.0,
					step: 0.1,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinking: false,
		},
		url: "https://www.anthropic.com/claude/haiku",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
