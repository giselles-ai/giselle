import { FalLanguageModel } from "@giselle-sdk/language-model";
import { z } from "zod";

export const ImageGenerationLanguageModelData = FalLanguageModel.pick({
	provider: true,
	id: true,
	configurations: true,
});
export type ImageGenerationLanguageModelData =
	typeof ImageGenerationLanguageModelData;

export const ImageGenerationContent = z.object({
	type: z.literal("imageGeneration"),
	llm: ImageGenerationLanguageModelData,
	prompt: z.string().optional(),
});
export type ImageGenerationContent = typeof ImageGenerationContent;

export const OverrideImageGenerationContent = z.object({
	type: z.literal("imageGeneration"),
	prompt: z.string(),
});
export type OverrideImageGenerationContent =
	typeof OverrideImageGenerationContent;
export function isOverrideImageGenerationContent(
	content: unknown,
): content is OverrideImageGenerationContent {
	return OverrideImageGenerationContent.safeParse(content).success;
}

export const ImageGenerationContentReference = z.object({
	type: ImageGenerationContent.shape.type,
});
export type ImageGenerationContentReference =
	typeof ImageGenerationContentReference;
