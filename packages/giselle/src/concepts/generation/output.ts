import type { LanguageModelV2Source } from "@ai-sdk/provider";
import { GitHubVectorStoreSource, OutputId } from "@giselle-sdk/data-type";
import { createIdGenerator } from "@giselle-sdk/utils";
import type { ProviderMetadata } from "ai";
import { z } from "zod/v4";

export const GenerationOutputBase = z.object({
	type: z.string(),
	outputId: OutputId.schema,
});

export const GeneratedTextOutputType = z.literal("generated-text");
export const GeneratedTextContentOutput = GenerationOutputBase.extend({
	type: GeneratedTextOutputType,
	content: z.string(),
});
export type GeneratedImageContentOutput = z.infer<
	typeof GeneratedImageContentOutput
>;

export const ImageId = createIdGenerator("img");
export const Image = z.object({
	id: ImageId.schema,
	filename: z.string(),
	pathname: z.string(),
	contentType: z.string(),
});
export type Image = z.infer<typeof Image>;

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
	url: z.url(),
	title: z.string(),
	providerOptions: z.custom<ProviderMetadata>().optional(),
}) as z.ZodType<UrlSource>;

export const SourceOutput = GenerationOutputBase.extend({
	type: z.literal("source"),
	sources: z.array(z.custom<LanguageModelV2Source>()),
});

const VectorStoreSource = GitHubVectorStoreSource;
const VectorStoreQueryResultRecord = z.object({
	chunkContent: z.string(),
	chunkIndex: z.number(),
	score: z.number(),
	metadata: z.record(z.string(), z.string()),
	additional: z.record(z.string(), z.unknown()).optional(),
});
const VectorStoreQueryResult = z.object({
	type: z.literal("vector-store"),
	source: VectorStoreSource,
	records: z.array(VectorStoreQueryResultRecord),
});

export const QueryResult = z.discriminatedUnion("type", [
	VectorStoreQueryResult,
]);
export const QueryResultOutputType = z.literal("query-result");
export const QueryResultOutput = GenerationOutputBase.extend({
	type: QueryResultOutputType,
	content: QueryResult.array(),
});

export const GenerationOutput = z.discriminatedUnion("type", [
	GeneratedTextContentOutput,
	GeneratedImageContentOutput,
	ReasoningOutput,
	SourceOutput,
	QueryResultOutput,
]);
export type GenerationOutput = z.infer<typeof GenerationOutput>;

export const OutputFileBlob = z.object({
	outputId: OutputId.schema,
	id: z.string(),
	contentType: z.string(),
	bytes: z.custom<Uint8Array<ArrayBufferLike>>(),
});
export type OutputFileBlob = z.infer<typeof OutputFileBlob>;
