import * as z from "zod/v4";
import {
	LanguageModel as AnthropicLanguageModel,
	models as anthropicLanguageModels,
} from "./anthropic";
import {
	LanguageModel as GoogleLanguageModel,
	models as googleLanguageModels,
} from "./google";
import {
	LanguageModel as GoogleImageLanguageModel,
	models as googleImageLanguageModels,
} from "./google-image";
import {
	LanguageModel as OpenAILanguageModel,
	models as openaiLanguageModels,
} from "./openai";
import {
	LanguageModel as OpenAIImageLanguageModel,
	models as openaiImageLanguageModels,
} from "./openai-image";

export * from "./base";
export * from "./costs";
export * from "./helper";
export {
	background as openaiImageBackground,
	models as openaiImageModels,
	moderation as openaiImageModeration,
	quality as openaiImageQuality,
	size as openaiImageSize,
} from "./openai-image";
export { createUsageCalculator } from "./usage-factory";

export const LanguageModel = z.union([
	AnthropicLanguageModel,
	GoogleLanguageModel,
	GoogleImageLanguageModel,
	OpenAILanguageModel,
	OpenAIImageLanguageModel,
]);
export type LanguageModel = z.infer<typeof LanguageModel>;

export const languageModels = [
	...googleLanguageModels,
	...googleImageLanguageModels,
	...anthropicLanguageModels,
	...openaiLanguageModels,
	...openaiImageLanguageModels,
];

export {
	AnthropicLanguageModel,
	GoogleLanguageModel,
	GoogleImageLanguageModel,
	OpenAILanguageModel,
	OpenAIImageLanguageModel,
	anthropicLanguageModels,
	googleLanguageModels,
	googleImageLanguageModels,
	openaiLanguageModels,
};

export const LanguageModelProviders = z.enum([
	AnthropicLanguageModel.shape.provider.value,
	GoogleLanguageModel.shape.provider.value,
	GoogleImageLanguageModel.shape.provider.value,
	OpenAILanguageModel.shape.provider.value,
	OpenAIImageLanguageModel.shape.provider.value,
]);
export type LanguageModelProvider = z.infer<typeof LanguageModelProviders>;

export { AnthropicLanguageModelId } from "./anthropic";
export { GoogleLanguageModelId } from "./google";
export { OpenAILanguageModelId } from "./openai";
