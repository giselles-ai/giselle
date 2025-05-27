import { z } from "zod/v4";
import {
	LanguageModel as AnthropicLanguageModel,
	models as anthropicLanguageModels,
} from "./anthropic";
import {
	LanguageModel as FalLanguageModel,
	models as falLanguageModels,
} from "./fal";
import {
	LanguageModel as GoogleLanguageModel,
	models as googleLanguageModels,
} from "./google";
import {
	LanguageModel as OpenAILanguageModel,
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
export * from "./costs";
export {
	getImageGenerationModelProvider,
	falImageGenerationSizes as imageGenerationSizes,
} from "./fal";
export { createUsageCalculator } from "./usage-factory";
export type { GeneratedImageData } from "./fal";
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
