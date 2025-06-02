import { z } from "zod";
import type { ActionBase } from "../base";

export const provider = "github" as const;

export interface GitHubActionBase extends ActionBase {
	provider: typeof provider;
}

export const githubCreateIssueAction = {
	provider,
	command: {
		id: "github.create.issue",
		label: "Create Issue",
		parameters: z.object({
			title: z.string(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

export const githubCreateIssueCommentAction = {
	provider,
	command: {
		id: "github.create.issueComment",
		label: "Create Issue Comment",
		parameters: z.object({
			issueNumber: z.coerce.number(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

export const githubCreatePullRequestCommentAction = {
	provider,
	command: {
		id: "github.create.pullRequestComment",
		label: "Create Pull Request Comment",
		parameters: z.object({
			pullNumber: z.coerce.number(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

export const githubCreatePullRequestReviewCommentAction = {
	provider,
	command: {
		id: "github.create.pullRequestReviewComment",
		label: "Create Pull Request Review Comment",
		parameters: z.object({
			pullNumber: z.coerce.number(),
			body: z.string(),
			commitId: z.string().optional(),
			path: z.string().optional(),
			line: z.coerce.number().optional(),
			side: z.enum(["LEFT", "RIGHT"]).optional(),
			startLine: z.coerce.number().optional(),
			startSide: z.enum(["LEFT", "RIGHT"]).optional(),
			subjectType: z.enum(["line", "file"]).optional(),
			inReplyTo: z.coerce.number().optional(),
		}),
	},
} as const satisfies GitHubActionBase;

export const actions = {
	[githubCreateIssueAction.command.id]: githubCreateIssueAction,
	[githubCreateIssueCommentAction.command.id]: githubCreateIssueCommentAction,
	[githubCreatePullRequestCommentAction.command.id]:
		githubCreatePullRequestCommentAction,
	[githubCreatePullRequestReviewCommentAction.command.id]:
		githubCreatePullRequestReviewCommentAction,
} as const;

export type GitHubAction =
	| typeof githubCreateIssueAction
	| typeof githubCreateIssueCommentAction
	| typeof githubCreatePullRequestCommentAction
	| typeof githubCreatePullRequestReviewCommentAction;

export type ActionCommandId = keyof typeof actions;

export function actionIdToLabel(triggerId: ActionCommandId) {
	switch (triggerId) {
		case "github.create.issue":
			return githubCreateIssueAction.command.label;
		case "github.create.issueComment":
			return githubCreateIssueCommentAction.command.label;
		case "github.create.pullRequestComment":
			return githubCreatePullRequestCommentAction.command.label;
		case "github.create.pullRequestReviewComment":
			return githubCreatePullRequestReviewCommentAction.command.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
