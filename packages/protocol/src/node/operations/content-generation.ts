import {
	isLanguageModelId,
	isLanguageModelProvider,
	type LanguageModelId,
	type LanguageModelProvider,
} from "@giselles-ai/language-model-registry";
import * as z from "zod/v4";

export const ContentGenerationContent = z.object({
	type: z.literal("contentGeneration"),
	version: z.literal("v1"),
	languageModel: z.object({
		provider: z.custom<LanguageModelProvider>((v) =>
			isLanguageModelProvider(v),
		),
		id: z.custom<LanguageModelId>((v) => isLanguageModelId(v)),
		configration: z.record(z.string(), z.any()),
	}),
	prompt: z.string(),
});

export type ContentGenerationContent = z.infer<typeof ContentGenerationContent>;

export const ContentGenerationContentReference = z.object({
	type: ContentGenerationContent.shape.type,
});
export type ContentGenerationContentReference = z.infer<
	typeof ContentGenerationContentReference
>;
