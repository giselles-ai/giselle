import { z } from "zod/v4";

const GitHubObjectType = z.enum(["issue", "issueComment"]);
const GitHubObjectReference = z.object({
	url: z.url(),
	owner: z.string(),
	repo: z.string(),
	type: GitHubObjectType,
	id: z.string(),
});
export const GitHubContent = z.object({
	type: z.literal("github"),
	objectReferences: z.array(GitHubObjectReference),
});
export type GitHubContent = z.infer<typeof GitHubContent>;

export const OverrideGitHubContent = z.object({
	type: z.literal("github"),
	objectReferences: z.array(GitHubObjectReference),
});
export type OverrideGitHubContent = z.infer<typeof OverrideGitHubContent>;

export function isOverrideGitHubContent(
	content: unknown,
): content is OverrideGitHubContent {
	return OverrideGitHubContent.safeParse(content).success;
}

export const GitHubContentReference = z.object({
	type: GitHubContent.shape.type,
});
export type GitHubContentReference = z.infer<typeof GitHubContentReference>;
