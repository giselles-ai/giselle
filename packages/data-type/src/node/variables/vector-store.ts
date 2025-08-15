import { z } from "zod/v4";

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
			contentType: z.enum(["blob", "pull_request"]),
			embeddingProfileId: z.number().int().positive().optional().default(1),
		}),
		z.object({
			status: z.literal("unconfigured"),
		}),
	]),
});
export type GitHubVectorStoreSource = z.infer<typeof GitHubVectorStoreSource>;

export const VectorStoreContent = VectorStoreContentBase.extend({
	source: GitHubVectorStoreSource,
});
export type VectorStoreContent = z.infer<typeof VectorStoreContent>;

export const VectorStoreContentReference = z.object({
	type: VectorStoreContent.shape.type,
});
export type VectorStoreContentReference = z.infer<
	typeof VectorStoreContentReference
>;
