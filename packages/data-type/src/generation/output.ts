import type { ProviderMetadata } from "ai";
import { z } from "zod";
import { OutputId } from "../node";

export const GenerationOutputBase = z.object({
	type: z.string(),
	outputId: OutputId.schema,
});

export const GeneratedTextOutputType = z.literal("generated-text");
export const GeneratedTextContentOutput = GenerationOutputBase.extend({
	type: GeneratedTextOutputType,
	content: z.string(),
});

export const Image = z.object({
	filename: z.string(),
});

export const GeneratedImageOuputType = z.literal("generated-image");
export const GeneratedImageContentOutput = GenerationOutputBase.extend({
	type: GeneratedImageOuputType,
	contents: Image.array(),
});

export const ReasoningOutput = GenerationOutputBase.extend({
	type: z.literal("reasoning"),
	content: z.string(),
});

export interface UrlSource {
	sourceType: "url";
	id: string;
	url: string;
	title: string;
	providerMetadata?: ProviderMetadata;
}
export const UrlSource = z.object({
	sourceType: z.literal("url"),
	id: z.string(),
	url: z.string().url(),
	title: z.string(),
	providerMetadata: z.custom<ProviderMetadata>().optional(),
}) as z.ZodType<UrlSource>;

export const Source = UrlSource;

export const SourceOutput = GenerationOutputBase.extend({
	type: z.literal("source"),
	sources: z.array(Source),
});

export const GenerationOutput = z.discriminatedUnion("type", [
	GeneratedTextContentOutput,
	GeneratedImageContentOutput,
	ReasoningOutput,
	SourceOutput,
]);
export type GenerationOutput = z.infer<typeof GenerationOutput>;
