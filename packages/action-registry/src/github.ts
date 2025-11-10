import { titleCase } from "@giselles-ai/utils";
import * as z from "zod/v4";

interface GitHubAction {
	id: string;
	label: string;
	payload: z.ZodObject;
}

export const githubCreateIssueAction = {
	id: "github.create.issue",
	label: "Create Issue",
	payload: z.object({
		title: z.string().meta({ label: "Title" }),
		body: z.string().meta({ label: "Body" }),
	}),
} as const satisfies GitHubAction;

export const githubCreateIssueCommentAction = {
	id: "github.create.issueComment",
	label: "Create Issue Comment",
	payload: z.object({
		issueNumber: z.coerce.number().meta({ label: "Issue number" }),
		body: z.string().meta({ label: "Body" }),
	}),
} as const satisfies GitHubAction;

export const githubCreatePullRequestCommentAction = {
	id: "github.create.pullRequestComment",
	label: "Create Pull Request Comment",
	payload: z.object({
		pullNumber: z.coerce.number().meta({ label: "Pull Request number" }),
		body: z.string().meta({ label: "Body" }),
	}),
} as const satisfies GitHubAction;

export const githubUpdatePullRequestAction = {
	id: "github.update.pullRequest",
	label: "Update Pull Request",
	payload: z.object({
		pullNumber: z.coerce.number().meta({ label: "Pull Request number" }),
		title: z.string().meta({ label: "Title" }),
		body: z.string().meta({ label: "Body" }),
	}),
} as const satisfies GitHubAction;

export const githubReplyPullRequestReviewCommentAction = {
	id: "github.reply.pullRequestReviewComment",
	label: "Reply Pull Request Review Comment",
	payload: z.object({
		pullNumber: z.coerce.number().meta({ label: "Pull Request number" }),
		commentId: z.coerce.number().meta({ label: "Comment ID" }),
		body: z.string().meta({ label: "Body" }),
	}),
} as const satisfies GitHubAction;

export const githubGetDiscussionAction = {
	id: "github.get.discussion",
	label: "Get Discussion",
	payload: z.object({
		discussionNumber: z.coerce.number().meta({ label: "Discussion number" }),
	}),
} as const satisfies GitHubAction;

export const githubCreateDiscussionCommentAction = {
	id: "github.create.discussionComment",
	label: "Create Discussion Comment",
	payload: z.object({
		discussionNumber: z.coerce.number().meta({ label: "Discussion number" }),
		body: z.string().meta({ label: "Body" }),
		commentId: z.coerce.number().optional().meta({ label: "Comment ID" }),
	}),
} as const satisfies GitHubAction;

export const githubActions = {
	// issues
	[githubCreateIssueAction.id]: githubCreateIssueAction,
	[githubCreateIssueCommentAction.id]: githubCreateIssueCommentAction,

	// pull requests
	[githubCreatePullRequestCommentAction.id]:
		githubCreatePullRequestCommentAction,
	[githubUpdatePullRequestAction.id]: githubUpdatePullRequestAction,
	[githubReplyPullRequestReviewCommentAction.id]:
		githubReplyPullRequestReviewCommentAction,

	// discussions
	[githubGetDiscussionAction.id]: githubGetDiscussionAction,
	[githubCreateDiscussionCommentAction.id]: githubCreateDiscussionCommentAction,
} as const;

type GitHubActions = typeof githubActions;
export type GitHubActionId = keyof GitHubActions;

export const githubActionEntries = Object.values(githubActions);

export function isGitHubActionId(id: string): id is GitHubActionId {
	return id in githubActions;
}

interface InputData {
	key: string;
	label: string;
	optional?: boolean;
}
export function githubActionToInputFields(githubAction: GitHubAction) {
	return githubAction.payload.keyof().options.map((key) => {
		const fieldSchema = githubAction.payload.shape[key] as
			| z.ZodString
			| z.ZodNumber;
		const labelMeta = fieldSchema.meta()?.label;
		const label = typeof labelMeta === "string" ? labelMeta : titleCase(key);
		const optional = fieldSchema.safeParse(undefined).success;
		return {
			key,
			label,
			optional,
		} satisfies InputData;
	});
}
