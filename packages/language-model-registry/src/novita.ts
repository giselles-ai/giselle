import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
	type LanguageModelProviderDefinition,
} from "./language-model";

const novitaProvider = {
	id: "novita",
	title: "Novita",
	metadata: {
		website: "https://novita.ai",
		documentationUrl: "https://novita.ai/docs",
	},
} as const satisfies LanguageModelProviderDefinition<"novita">;

export const novita = {
	"novita/deepseek/deepseek-v3.2": defineLanguageModel({
		provider: novitaProvider,
		id: "novita/deepseek/deepseek-v3.2",
		name: "DeepSeek V3.2",
		description:
			"DeepSeek V3.2 is a strong language model with improved reasoning and coding capabilities.",
		contextWindow: 128_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2024, 11, 31).getTime(),
		pricing: {
			input: definePricing(0.14),
			output: definePricing(0.28),
		},
		requiredTier: "free",
		url: "https://novita.ai/models/deepseek-ai/deepseek-v3.2",
	}),
	"novita/zai-org/glm-5": defineLanguageModel({
		provider: novitaProvider,
		id: "novita/zai-org/glm-5",
		name: "GLM-5",
		description:
			"GLM-5 is a large language model developed by Zhipu AI with strong multilingual capabilities.",
		contextWindow: 128_000,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2024, 6, 31).getTime(),
		pricing: {
			input: definePricing(0.5),
			output: definePricing(0.5),
		},
		requiredTier: "free",
		url: "https://novita.ai/models/zhipu-ai/glm-5",
	}),
	"novita/minimax/minimax-m2.5": defineLanguageModel({
		provider: novitaProvider,
		id: "novita/minimax/minimax-m2.5",
		name: "MiniMax M2.5",
		description:
			"MiniMax M2.5 is a high-performance language model from MiniMax AI with strong reasoning capabilities.",
		contextWindow: 32_768,
		maxOutputTokens: 8_192,
		knowledgeCutoff: new Date(2024, 9, 31).getTime(),
		pricing: {
			input: definePricing(0.5),
			output: definePricing(0.5),
		},
		requiredTier: "free",
		url: "https://novita.ai/models/MiniMax/MiniMax-M2.5",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
