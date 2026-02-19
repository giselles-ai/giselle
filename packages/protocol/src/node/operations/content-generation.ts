import {
	isLanguageModelId,
	isLanguageModelProvider,
	isLanguageModelToolName,
	type LanguageModelId,
	type LanguageModelProvider,
	type LanguageModelToolName,
} from "@giselles-ai/language-model-registry";
import * as z from "zod/v4";
import { OutputConfiguration } from "../../structured-output";

export const ContentGenerationContent = z.object({
	type: z.literal("contentGeneration"),
	version: z.literal("v1"),
	languageModel: z.object({
		provider: z.custom<LanguageModelProvider>((v) =>
			isLanguageModelProvider(v),
		),
		id: z.custom<LanguageModelId>(isLanguageModelId),
		configuration: z.record(z.string(), z.any()),
	}),
	tools: z.array(
		z.object({
			name: z.custom<LanguageModelToolName>(isLanguageModelToolName),
			configuration: z.record(z.string(), z.any()),
		}),
	),
	prompt: z.string(),
	outputConfiguration: OutputConfiguration.default({ outputFormat: "text" }),
});

export type ContentGenerationContent = z.infer<typeof ContentGenerationContent>;

export const ContentGenerationContentReference = z.object({
	type: ContentGenerationContent.shape.type,
});
export type ContentGenerationContentReference = z.infer<
	typeof ContentGenerationContentReference
>;
