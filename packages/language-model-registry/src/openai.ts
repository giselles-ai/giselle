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

/**
 * `reasoningEffort` configuration for OpenAI models.
 * Default values follow OpenAI's official defaults for each model.
 * @see https://platform.openai.com/docs/api-reference/responses/create#responses_create-reasoning-effort
 */
export const openai = {
	"openai/gpt-5.1-thinking": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5.1-thinking",
		name: "GPT-5.1",
		description:
			"An upgraded version of GPT-5 that adapts thinking time more precisely to the question to spend more time on complex questions and respond more quickly to simpler tasks.",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		requiredTier: "pro",
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
	"openai/gpt-5.1-codex": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5.1-codex",
		name: "GPT-5.1 Codex",
		description:
			"GPT-5.1-Codex is a version of GPT-5.1 optimized for agentic coding tasks in Codex or similar environments.",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		requiredTier: "pro",
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
		url: "https://platform.openai.com/docs/models/gpt-5.1-codex",
	}),

	"openai/gpt-5": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5",
		name: "GPT-5",
		description:
			"GPT-5 is OpenAI's flagship language model that excels at complex reasoning, broad real-world knowledge, code-intensive, and multi-step agentic tasks.",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		requiredTier: "pro",
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
		url: "https://platform.openai.com/docs/models/gpt-5",
	}),

	"openai/gpt-5-codex": defineLanguageModel({
		provider: "openai",
		id: "openai/gpt-5-codex",
		name: "GPT-5-Codex",
		description:
			"GPT-5-Codex is a version of GPT-5 optimized for agentic coding tasks in Codex or similar environments.",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 8, 30).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		requiredTier: "pro",
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
		name: "GPT-5 mini",
		description:
			"GPT-5 mini is a cost optimized model that excels at reasoning/chat tasks. It offers an optimal balance between speed, cost, and capability.",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 4, 31).getTime(),
		pricing: {
			input: definePricing(0.25),
			output: definePricing(2.0),
		},
		requiredTier: "pro",
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
		name: "GPT-5 nano",
		description:
			"GPT-5 nano is a high throughput model that excels at simple instruction or classification tasks.",
		contextWindow: 400_000,
		maxOutputTokens: 128_000,
		knowledgeCutoff: new Date(2024, 4, 31).getTime(),
		pricing: {
			input: definePricing(0.05),
			output: definePricing(0.4),
		},
		requiredTier: "free",
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
