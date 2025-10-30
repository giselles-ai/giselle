import { z } from "zod/v4";
import { EmbeddingProfileIdSchema } from "../../embedding";

const VectorStoreContentBase = z.object({
	type: z.literal("vectorStore"),
});

export const GitHubVectorStoreSource = z.object({
	provider: z.literal("github"),
	state: z.discriminatedUnion("status", [
		z.object({
			status: z.literal("configured"),
			owner: z.string(),
			repo: z.string(),
			contentType: z.enum(["blob", "pull_request", "issue"]),
			embeddingProfileId: EmbeddingProfileIdSchema.optional(),
		}),
		z.object({
			status: z.literal("unconfigured"),
		}),
	]),
});
export type GitHubVectorStoreSource = z.infer<typeof GitHubVectorStoreSource>;

export const DocumentVectorStoreSource = z.object({
	provider: z.literal("document"),
	state: z.discriminatedUnion("status", [
		z.object({
			status: z.literal("configured"),
			documentVectorStoreId: z.string(),
			embeddingProfileId: EmbeddingProfileIdSchema.optional(),
		}),
		z.object({
			status: z.literal("unconfigured"),
		}),
	]),
});
export type DocumentVectorStoreSource = z.infer<
	typeof DocumentVectorStoreSource
>;

export const VectorStoreContent = VectorStoreContentBase.extend({
	source: z.union([GitHubVectorStoreSource, DocumentVectorStoreSource]),
});
export type VectorStoreContent = z.infer<typeof VectorStoreContent>;

export const VectorStoreContentReference = z.object({
	type: VectorStoreContent.shape.type,
});
export type VectorStoreContentReference = z.infer<
	typeof VectorStoreContentReference
>;
