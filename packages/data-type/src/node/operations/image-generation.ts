import {
	FalLanguageModel,
	OpenAIImageLanguageModel,
} from "@giselle-sdk/language-model";
import { z } from "zod/v4";

export const FalLanguageModelData = FalLanguageModel.pick({
	provider: true,
	id: true,
	configurations: true,
});
export type FalLanguageModelData = z.infer<typeof FalLanguageModelData>;

export const OpenAIImageLanguageModelData = OpenAIImageLanguageModel.pick({
	provider: true,
	id: true,
	configurations: true,
});
export type OpenAIImageLanguageModelData = z.infer<
	typeof OpenAIImageLanguageModelData
>;

export const ImageGenerationLanguageModelData = z.discriminatedUnion(
	"provider",
	[OpenAIImageLanguageModelData, FalLanguageModelData],
);
export type ImageGenerationLanguageModelData = z.infer<
	typeof ImageGenerationLanguageModelData
>;
export function isImageGenerationLanguageModelData(
	data: unknown,
): data is ImageGenerationLanguageModelData {
	return ImageGenerationLanguageModelData.safeParse(data).success;
}

export const ImageGenerationLanguageModelProvider = z.enum([
	OpenAIImageLanguageModelData.shape.provider.value,
	FalLanguageModelData.shape.provider.value,
]);
export type ImageGenerationLanguageModelProvider = z.infer<
	typeof ImageGenerationLanguageModelProvider
>;

export const ImageGenerationContent = z.object({
	type: z.literal("imageGeneration"),
	llm: ImageGenerationLanguageModelData,
	prompt: z.string().optional(),
});
export type ImageGenerationContent = z.infer<typeof ImageGenerationContent>;

export const ImageGenerationContentReference = z.object({
	type: ImageGenerationContent.shape.type,
});
export type ImageGenerationContentReference =
	typeof ImageGenerationContentReference;
