import { z } from "zod/v4";

export const EmbeddingProvider = z.enum(["openai", "google"]);
export type EmbeddingProvider = z.infer<typeof EmbeddingProvider>;

export const OpenAIEmbeddingModel = z.enum([
	"text-embedding-3-small",
	"text-embedding-3-large",
]);
export type OpenAIEmbeddingModel = z.infer<typeof OpenAIEmbeddingModel>;

export const GeminiEmbeddingModel = z.enum(["gemini-embedding-001"]);
export type GeminiEmbeddingModel = z.infer<typeof GeminiEmbeddingModel>;

export const EmbeddingModelId = z.union([
	OpenAIEmbeddingModel,
	GeminiEmbeddingModel,
]);
export type EmbeddingModelId = z.infer<typeof EmbeddingModelId>;

export const EmbeddingDimensions = z.union([z.literal(1536), z.literal(3072)]);
export type EmbeddingDimensions = z.infer<typeof EmbeddingDimensions>;

export {
	EMBEDDING_PROFILES,
	type EmbeddingProfileId,
	isEmbeddingProfileId,
} from "./profiles";
