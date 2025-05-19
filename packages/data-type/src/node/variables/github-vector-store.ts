import { z } from "zod";

export const GitHubVectorStoreContent = z.object({
	type: z.literal("githubVectorStore"),
	owner: z.string(),
	repo: z.string(),
});
export type GitHubVectorStoreContent = z.infer<typeof GitHubVectorStoreContent>;

export function isGitHubVectorStoreContent(
	content: unknown,
): content is GitHubVectorStoreContent {
	return GitHubVectorStoreContent.safeParse(content).success;
}

export const GitHubVectorStoreContentReference = z.object({
	type: GitHubVectorStoreContent.shape.type,
});
export type GitHubVectorStoreContentReference = z.infer<
	typeof GitHubVectorStoreContentReference
>;
