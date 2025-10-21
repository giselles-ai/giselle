import { z } from "zod";
import type { ActionBase } from "../base";

export const provider = "github" as const;

interface GitHubActionBase extends ActionBase {
	provider: typeof provider;
}

const githubCreateIssueAction = {
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

const githubCreateIssueCommentAction = {
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

const githubCreatePullRequestCommentAction = {
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

const githubUpdatePullRequestAction = {
	provider,
	command: {
		id: "github.update.pullRequest",
		label: "Update Pull Request",
		parameters: z.object({
			pullNumber: z.coerce.number(),
			title: z.string(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

const githubReplyPullRequestReviewCommentAction = {
	provider,
	command: {
		id: "github.reply.pullRequestReviewComment",
		label: "Reply to Pull Request Review Comment",
		parameters: z.object({
			pullNumber: z.coerce.number(),
			commentId: z.coerce.number(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

const githubGetDiscussionAction = {
	provider,
	command: {
		id: "github.get.discussion",
		label: "Get Discussion",
		parameters: z.object({
			discussionNumber: z.coerce.number(),
		}),
	},
} as const satisfies GitHubActionBase;

const githubCreateDiscussionCommentAction = {
	provider,
	command: {
		id: "github.create.discussionComment",
		label: "Create Discussion Comment",
		parameters: z.object({
			discussionNumber: z.coerce.number(),
			body: z.string(),
			commentId: z.coerce.number().optional(),
		}),
	},
} as const satisfies GitHubActionBase;

export const actions = {
	[githubCreateIssueAction.command.id]: githubCreateIssueAction,
	[githubCreateIssueCommentAction.command.id]: githubCreateIssueCommentAction,
	[githubCreatePullRequestCommentAction.command.id]:
		githubCreatePullRequestCommentAction,
	[githubUpdatePullRequestAction.command.id]: githubUpdatePullRequestAction,
	[githubReplyPullRequestReviewCommentAction.command.id]:
		githubReplyPullRequestReviewCommentAction,
	[githubGetDiscussionAction.command.id]: githubGetDiscussionAction,
	[githubCreateDiscussionCommentAction.command.id]:
		githubCreateDiscussionCommentAction,
} as const;

export type GitHubAction =
	| typeof githubCreateIssueAction
	| typeof githubCreateIssueCommentAction
	| typeof githubCreatePullRequestCommentAction
	| typeof githubUpdatePullRequestAction
	| typeof githubReplyPullRequestReviewCommentAction
	| typeof githubGetDiscussionAction
	| typeof githubCreateDiscussionCommentAction;

export type ActionCommandId = keyof typeof actions;

export function actionIdToLabel(triggerId: ActionCommandId) {
	switch (triggerId) {
		case "github.create.issue":
			return githubCreateIssueAction.command.label;
		case "github.create.issueComment":
			return githubCreateIssueCommentAction.command.label;
		case "github.create.pullRequestComment":
			return githubCreatePullRequestCommentAction.command.label;
		case "github.update.pullRequest":
			return githubUpdatePullRequestAction.command.label;
		case "github.reply.pullRequestReviewComment":
			return githubReplyPullRequestReviewCommentAction.command.label;
		case "github.get.discussion":
			return githubGetDiscussionAction.command.label;
		case "github.create.discussionComment":
			return githubCreateDiscussionCommentAction.command.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
