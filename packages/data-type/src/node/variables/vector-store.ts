import { z } from "zod/v4";

const VectorStoreContentBase = z.object({
	type: z.literal("vectorStore"),
});
type VectorStoreContentBase = z.infer<typeof VectorStoreContentBase>;

export const GitHubVectorStoreSource = z.object({
	provider: z.literal("github"),
	state: z.discriminatedUnion("status", [
		z.object({
			status: z.literal("configured"),
			owner: z.string(),
			repo: z.string(),
		}),
		z.object({
			status: z.literal("unconfigured"),
		}),
	]),
});
export type GitHubVectorStoreSource = z.infer<typeof GitHubVectorStoreSource>;

export const VectorStoreContent = VectorStoreContentBase.extend({
	source: z.discriminatedUnion("provider", [GitHubVectorStoreSource]),
});
export type VectorStoreContent = z.infer<typeof VectorStoreContent>;

export const VectorStoreContentReference = z.object({
	type: VectorStoreContent.shape.type,
});
export type VectorStoreContentReference = z.infer<
	typeof VectorStoreContentReference
>;
