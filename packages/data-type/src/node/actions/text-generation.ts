import {
	AnthropicLanguageModel,
	GoogleLanguageModel,
	OpenAILanguageModel,
} from "@giselle-sdk/language-model";
import { z } from "zod";

export const AnthropicLanguageModelData = AnthropicLanguageModel.pick({
	provider: true,
	id: true,
	configurations: true,
});
export type AnthropicLanguageModelData = z.infer<
	typeof AnthropicLanguageModelData
>;
export const GoogleLanguageModelData = GoogleLanguageModel.pick({
	provider: true,
	id: true,
	configurations: true,
});
export type GoogleLanguageModelData = z.infer<typeof GoogleLanguageModelData>;
export const OpenAILanguageModelData = OpenAILanguageModel.pick({
	provider: true,
	id: true,
	configurations: true,
});
export type OpenAILanguageModelData = z.infer<typeof OpenAILanguageModelData>;

export const LanguageModelData = z.discriminatedUnion("provider", [
	AnthropicLanguageModelData,
	GoogleLanguageModelData,
	OpenAILanguageModelData,
]);
export type LanguageModelData = z.infer<typeof LanguageModelData>;

export const TextGenerationContent = z.object({
	type: z.literal("textGeneration"),
	llm: LanguageModelData,
	prompt: z.string().optional(),
});
export type TextGenerationContent = z.infer<typeof TextGenerationContent>;

export const OverrideTextGenerationContent = z.object({
	type: z.literal("textGeneration"),
	prompt: z.string(),
});
export type OverrideTextGenerationContent = z.infer<
	typeof OverrideTextGenerationContent
>;

export function isOverrideTextGenerationContent(
	content: unknown,
): content is OverrideTextGenerationContent {
	return OverrideTextGenerationContent.safeParse(content).success;
}

export const TextGenerationContentReference = z.object({
	type: TextGenerationContent.shape.type,
});
export type TextGenerationContentReference = z.infer<
	typeof TextGenerationContentReference
>;
