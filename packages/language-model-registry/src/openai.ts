import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";

const reasoningEffortDescription =
	"Constrains effort on reasoning for reasoning models. Reducing reasoning effort can result in faster responses and fewer tokens used on reasoning in a response.";
const textVerbosityDescription =
	"Constrains the verbosity of the model's response. Lower values will result in more concise responses, while higher values will result in more verbose responses. Currently supported values";

export const openai = {
	"openai/gpt-5.1-thinking": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5.1-thinking",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		tier: "pro",
		configurationOptions: {
			reasoningEffort: {
				description: reasoningEffortDescription,
				schema: z.enum(["none", "low", "medium", "high"]),
			},
			textVerbosity: {
				description: textVerbosityDescription,
				schema: z.enum(["low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			reasoningEffort: "none",
			textVerbosity: "medium",
		},
		url: "https://platform.openai.com/docs/models/gpt-5.1",
	}),

	"openai/gpt-5": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		tier: "pro",
		configurationOptions: {
			reasoningEffort: {
				description: reasoningEffortDescription,
				schema: z.enum(["minimal", "low", "medium", "high"]),
			},
			textVerbosity: {
				description: textVerbosityDescription,
				schema: z.enum(["low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			reasoningEffort: "minimal",
			textVerbosity: "medium",
		},
		url: "https://platform.openai.com/docs/models/gpt-5",
	}),

	"openai/gpt-5-codex": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5-codex",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		tier: "pro",
		configurationOptions: {
			reasoningEffort: {
				description: reasoningEffortDescription,
				schema: z.enum(["minimal", "low", "medium", "high"]),
			},
			textVerbosity: {
				description: textVerbosityDescription,
				schema: z.enum(["low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			reasoningEffort: "medium",
			textVerbosity: "medium",
		},
		url: "https://platform.openai.com/docs/models/gpt-5-codex",
	}),

	"openai/gpt-5-mini": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5-mini",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 4, 31).getTime(),
		pricing: {
			input: definePricing(0.25),
			output: definePricing(2.0),
		},
		tier: "pro",
		configurationOptions: {
			reasoningEffort: {
				description: reasoningEffortDescription,
				schema: z.enum(["minimal", "low", "medium", "high"]),
			},
			textVerbosity: {
				description: textVerbosityDescription,
				schema: z.enum(["low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			reasoningEffort: "medium",
			textVerbosity: "medium",
		},
		url: "https://platform.openai.com/docs/models/gpt-5-mini",
	}),

	"openai/gpt-5-nano": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5-nano",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 4, 31).getTime(),
		pricing: {
			input: definePricing(0.05),
			output: definePricing(0.4),
		},
		tier: "free",
		configurationOptions: {
			reasoningEffort: {
				description: reasoningEffortDescription,
				schema: z.enum(["minimal", "low", "medium", "high"]),
			},
			textVerbosity: {
				description: textVerbosityDescription,
				schema: z.enum(["low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			reasoningEffort: "medium",
			textVerbosity: "medium",
		},
		url: "https://platform.openai.com/docs/models/gpt-5-nano",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
