import { z } from "zod";
import type { TriggerBase } from "../base";

const provider = "github" as const;
export interface GitHubTrigger extends TriggerBase {
	provider: typeof provider;
}

export const githubTrigger = {
	provider,
	id: "github",
	label: "GitHub",
	payloads: z.object({
		title: z.string().optional(),
		body: z.string(),
		issueNumber: z.number().optional(),
		issueTitle: z.string().optional(),
		issueBody: z.string().optional(),
		repositoryOwner: z.string(),
		repositoryName: z.string(),
	}),
} as const satisfies GitHubTrigger;

// 互換性のために古いエクスポートを維持
export const githubIssueCreatedTrigger = githubTrigger;
export const githubIssueCommentCreatedTrigger = githubTrigger;

export const triggers = [githubTrigger] as const;
