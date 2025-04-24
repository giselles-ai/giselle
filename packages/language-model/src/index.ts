import { z } from "zod";
import {
	LanguageModel as AnthropicLanguageModel,
	models as anthropicLanguageModels,
} from "./anthropic";
import type { CostResult } from "./costs/calculator";
import type { TokenUsage } from "./costs/usage";
import {
	LanguageModel as FalLanguageModel,
	models as falLanguageModels,
} from "./fal";
import {
	LanguageModel as GoogleLanguageModel,
	models as googleLanguageModels,
} from "./google";
import {
	OpenAICostCalculator,
	LanguageModel as OpenAILanguageModel,
	type OpenAIWebSearchConfig,
	models as openaiLanguageModels,
} from "./openai";
import {
	LanguageModel as OpenAIImageLanguageModel,
	models as openaiImageLanguageModels,
} from "./openai-image";
import {
	LanguageModel as PerplexityLanguageModel,
	models as perplexityLanguageModels,
} from "./perplexity";

export * from "./base";
export * from "./helper";
export {
	getImageGenerationModelProvider,
	falImageGenerationSizes as imageGenerationSizes,
	createUsageCalculator,
} from "./fal";
export type { FalImageResult, GeneratedImageData } from "./fal";
export {
	size as openaiImageSize,
	quality as openaiImageQuality,
	moderation as openaiImageModeration,
	background as openaiImageBackground,
	models as openaiImageModels,
} from "./openai-image";

export const LanguageModel = z.union([
	AnthropicLanguageModel,
	GoogleLanguageModel,
	OpenAILanguageModel,
	OpenAIImageLanguageModel,
	PerplexityLanguageModel,
	FalLanguageModel,
]);
export type LanguageModel = z.infer<typeof LanguageModel>;

export const languageModels = [
	...googleLanguageModels,
	...anthropicLanguageModels,
	...openaiLanguageModels,
	...openaiImageLanguageModels,
	...perplexityLanguageModels,
	...falLanguageModels,
];

export {
	AnthropicLanguageModel,
	GoogleLanguageModel,
	OpenAILanguageModel,
	OpenAIImageLanguageModel,
	PerplexityLanguageModel,
	FalLanguageModel,
	anthropicLanguageModels,
	openaiLanguageModels,
	googleLanguageModels,
	perplexityLanguageModels,
	falLanguageModels,
};

export const LanguageModelProviders = z.enum([
	AnthropicLanguageModel.shape.provider.value,
	GoogleLanguageModel.shape.provider.value,
	OpenAILanguageModel.shape.provider.value,
	OpenAIImageLanguageModel.shape.provider.value,
	PerplexityLanguageModel.shape.provider.value,
	FalLanguageModel.shape.provider.value,
]);
export type LanguageModelProvider = z.infer<typeof LanguageModelProviders>;

const costCalculators = {
	openai: {
		default: new OpenAICostCalculator(),
	},
	anthropic: {
		default: new OpenAICostCalculator(),
	},
	google: {
		default: new OpenAICostCalculator(),
	},
	perplexity: {
		default: new OpenAICostCalculator(),
	},
	fal: {
		default: new OpenAICostCalculator(),
	},
} as const;

function getCostCalculator(provider: LanguageModelProvider, model: string) {
	const providerCalculators = costCalculators[provider];
	return (
		providerCalculators[model as keyof typeof providerCalculators] ??
		providerCalculators.default
	);
}

export function calculateModelCost(
	provider: LanguageModelProvider,
	model: string,
	toolConfig: OpenAIWebSearchConfig | undefined,
	usage: TokenUsage,
): CostResult {
	const calculator = getCostCalculator(provider, model);
	return calculator.calculate(model, toolConfig, usage);
}
