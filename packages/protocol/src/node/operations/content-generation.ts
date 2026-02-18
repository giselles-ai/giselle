import {
	isLanguageModelId,
	isLanguageModelProvider,
	isLanguageModelToolName,
	type LanguageModelId,
	type LanguageModelProvider,
	type LanguageModelToolName,
} from "@giselles-ai/language-model-registry";
import * as z from "zod/v4";

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
	outputFormat: z.enum(["text", "json"]).default("text"),
	jsonSchema: z
		.object({
			title: z.string(),
			type: z.literal("object"),
			properties: z.record(z.string(), z.any()),
			additionalProperties: z.literal(false),
			required: z.array(z.string()),
		})
		.optional(),
});

export type ContentGenerationContent = z.infer<typeof ContentGenerationContent>;

export const ContentGenerationContentReference = z.object({
	type: ContentGenerationContent.shape.type,
});
export type ContentGenerationContentReference = z.infer<
	typeof ContentGenerationContentReference
>;
