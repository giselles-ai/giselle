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

export const githubReplyPullRequestReviewCommentAction = {
	provider,
	command: {
		id: "github.reply.pullRequestReviewComment",
		label: "Reply Pull Request Review Comment",
		parameters: z.object({
			pullNumber: z.coerce.number(),
			commentId: z.coerce.number(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

export const githubGetDiscussionAction = {
	provider,
	command: {
		id: "github.get.discussion",
		label: "Get Discussion",
		parameters: z.object({
			discussionNumber: z.coerce.number(),
		}),
	},
} as const satisfies GitHubActionBase;

export const actions = {
	[githubCreateIssueAction.command.id]: githubCreateIssueAction,
	[githubCreateIssueCommentAction.command.id]: githubCreateIssueCommentAction,
	[githubCreatePullRequestCommentAction.command.id]:
		githubCreatePullRequestCommentAction,
	[githubReplyPullRequestReviewCommentAction.command.id]:
		githubReplyPullRequestReviewCommentAction,
	[githubGetDiscussionAction.command.id]: githubGetDiscussionAction,
} as const;

export type GitHubAction =
	| typeof githubCreateIssueAction
	| typeof githubCreateIssueCommentAction
	| typeof githubCreatePullRequestCommentAction
	| typeof githubReplyPullRequestReviewCommentAction
	| typeof githubGetDiscussionAction;

export type ActionCommandId = keyof typeof actions;

export function actionIdToLabel(triggerId: ActionCommandId) {
	switch (triggerId) {
		case "github.create.issue":
			return githubCreateIssueAction.command.label;
		case "github.create.issueComment":
			return githubCreateIssueCommentAction.command.label;
		case "github.create.pullRequestComment":
			return githubCreatePullRequestCommentAction.command.label;
		case "github.reply.pullRequestReviewComment":
			return githubReplyPullRequestReviewCommentAction.command.label;
		case "github.get.discussion":
			return githubGetDiscussionAction.command.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
