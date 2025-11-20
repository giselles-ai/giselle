import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";

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
				description: "Constrains effort on reasoning.",
				schema: z.enum(["none", "low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			reasoningEffort: "none",
		},
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
				description: "Constrains effort on reasoning.",
				schema: z.enum(["minimal", "low", "medium", "high"]),
			},
		},
		defaultConfiguration: {
			// 🔒 こっちは "minimal" | "low" | "medium" | "high"
			reasoningEffort: "minimal",
		},
	}),
} as const satisfies Record<string, AnyLanguageModel>;
