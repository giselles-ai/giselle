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
		}),
		z.object({
			status: z.literal("unconfigured"),
		}),
	]),
});
export type GitHubVectorStoreSource = z.infer<typeof GitHubVectorStoreSource>;

export const GitHubPullRequestVectorStoreSource = z.object({
	provider: z.literal("githubPullRequest"),
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
export type GitHubPullRequestVectorStoreSource = z.infer<
	typeof GitHubPullRequestVectorStoreSource
>;

export const VectorStoreContent = VectorStoreContentBase.extend({
	source: z.discriminatedUnion("provider", [
		GitHubVectorStoreSource,
		GitHubPullRequestVectorStoreSource,
	]),
});
export type VectorStoreContent = z.infer<typeof VectorStoreContent>;

export const VectorStoreContentReference = z.object({
	type: VectorStoreContent.shape.type,
});
export type VectorStoreContentReference = z.infer<
	typeof VectorStoreContentReference
>;
