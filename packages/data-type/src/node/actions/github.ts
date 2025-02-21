import { z } from "zod";
import { NodeBase } from "../base";

export const GitHubContent = z.object({
	type: z.literal("github"),
	prompt: z.string(),
});

export type GitHubContent = z.infer<typeof GitHubContent>;

export const GitHubNode = NodeBase.extend({
	type: z.literal("action"),
	content: GitHubContent,
});
type GitHubNodeType = z.infer<typeof GitHubNode>;

export function isGitHubNode(args?: unknown): args is GitHubNodeType {
	const result = GitHubNode.safeParse(args);
	return result.success;
}
