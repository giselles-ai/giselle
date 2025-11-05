import { z } from "zod/v4";
import type { EmbeddingProfileId } from "./profiles";
import { isEmbeddingProfileId } from "./profiles";

export const EmbeddingProvider = z.enum(["openai", "google", "cohere"]);
export type EmbeddingProvider = z.infer<typeof EmbeddingProvider>;

export const OpenAIEmbeddingModel = z.enum([
	"text-embedding-3-small",
	"text-embedding-3-large",
]);
export type OpenAIEmbeddingModel = z.infer<typeof OpenAIEmbeddingModel>;

export const GeminiEmbeddingModel = z.enum(["gemini-embedding-001"]);
export type GeminiEmbeddingModel = z.infer<typeof GeminiEmbeddingModel>;

export const CohereEmbeddingModel = z.enum(["embed-4"]);
export type CohereEmbeddingModel = z.infer<typeof CohereEmbeddingModel>;

export const EmbeddingModelId = z.union([
	OpenAIEmbeddingModel,
	GeminiEmbeddingModel,
	CohereEmbeddingModel,
]);
export type EmbeddingModelId = z.infer<typeof EmbeddingModelId>;

export const EmbeddingDimensions = z.union([
	z.literal(1024),
	z.literal(1536),
	z.literal(3072),
]);
export type EmbeddingDimensions = z.infer<typeof EmbeddingDimensions>;

// Schema for validating embedding profile IDs against known profiles
export const EmbeddingProfileIdSchema = z.custom<EmbeddingProfileId>(
	(val) =>
		typeof val === "number" &&
		Number.isInteger(val) &&
		isEmbeddingProfileId(val),
	{ message: "Invalid embedding profile id" },
);

export {
	DEFAULT_EMBEDDING_PROFILE_ID,
	EMBEDDING_PROFILES,
	type EmbeddingProfile,
	type EmbeddingProfileId,
	isEmbeddingProfileId,
} from "./profiles";
