import { titleCase } from "@giselles-ai/utils";
import z from "zod/v4";

interface GitHubEvent {
	id: string;
	label: string;
	payload: z.ZodObject;
}

const PayloadFieldMeta = z.object({
	label: z.string().optional(),
	input: z
		.object({
			multiline: z.boolean().optional(),
		})
		.optional(),
});

export const githubIssueCreatedEvent = {
	id: "github.issue.created",
	label: "Issue Created",
	payload: z.object({
		issueNumber: z.coerce.string().meta({ label: "Issue Number" }),
		title: z.string().meta({ label: "Issue Title" }),
		body: z
			.string()
			.optional()
			.meta({ label: "Issue Body", input: { multline: true } }),
	}),
} as const satisfies GitHubEvent;

export const githubIssueClosedEvent = {
	id: "github.issue.closed",
	label: "Issue Closed",
	payload: z.object({
		issueNumber: z.coerce.string().meta({ label: "Issue Number" }),
		title: z.string().meta({ label: "Issue Title" }),
		body: z
			.string()
			.optional()
			.meta({ label: "Issue Body", input: { multline: true } }),
	}),
} as const satisfies GitHubEvent;

export const githubIssueCommentCreatedEvent = {
	id: "github.issue_comment.created",
	label: "Issue Comment Created",
	payload: z.object({
		issueNumber: z.coerce.string().meta({ label: "Issue Number" }),
		issueTitle: z.string().meta({ label: "Issue Title" }),
		issueBody: z
			.string()
			.optional()
			.meta({ label: "Issue Body", input: { multline: true } }),
		body: z
			.string()
			.optional()
			.meta({ label: "Issue Comment", input: { multline: true } }),
	}),
} as const satisfies GitHubEvent;

export const githubIssueLabeledEvent = {
	id: "github.issue.labeled",
	label: "Issue Labeled",
	payload: z.object({
		issueNumber: z.coerce.string().meta({ label: "Issue Number" }),
		title: z.string().meta({ label: "Issue Title" }),
		body: z
			.string()
			.optional()
			.meta({ label: "Issue Body", input: { multline: true } }),
		labelName: z.string().meta({ label: "Issue Label Name" }),
	}),
} as const satisfies GitHubEvent;

export const githubPullRequestCommentCreatedEvent = {
	id: "github.pull_request_comment.created",
	label: "Pull Request Comment Created",
	payload: z.object({
		issueNumber: z.coerce.string().meta({ label: "Pull Request Number" }),
		issueTitle: z.string().meta({ label: "Pull Request Title" }),
		issueBody: z
			.string()
			.optional()
			.meta({ label: "Pull Request Body", input: { multline: true } }),
		body: z
			.string()
			.optional()
			.meta({ label: "Pull Request Comment", input: { multline: true } }),
		diff: z
			.string()
			.meta({ label: "Pull Request Diff", input: { multline: true } }),
	}),
} as const satisfies GitHubEvent;

export const githubPullRequestReviewCommentCreatedEvent = {
	id: "github.pull_request_review_comment.created",
	label: "Pull Request Review Comment Created",
	payload: z.object({
		id: z.coerce.string().meta({ label: "Review Comment ID" }),
		body: z
			.string()
			.meta({ label: "Review Comment Body", input: { multline: true } }),
		diff: z.string().meta({ label: "Review Comment Diff" }),
		previousCommentBody: z
			.string()
			.meta({ label: "Previous Comment Body", input: { multline: true } }),
		pullRequestNumber: z.coerce.string().meta({ label: "Pull Request Number" }),
		pullRequestTitle: z.string().meta({ label: "Pull Request Title" }),
		pullRequestBody: z
			.string()
			.optional()
			.meta({ label: "Pull Request Body", input: { multline: true } }),
	}),
} as const satisfies GitHubEvent;

export const githubDiscussionCommentCreatedEvent = {
	id: "github.discussion_comment.created",
	label: "Discussion Comment Created",
	payload: z.object({
		body: z.string().meta({ label: "Comment Body", input: { multline: true } }),
		discussionNumber: z.coerce.string().meta({ label: "Discussion Number" }),
		discussionTitle: z.string().meta({ label: "Discussion Title" }),
		discussionBody: z
			.string()
			.meta({ label: "Discussion Body", input: { multline: true } }),
		discussionUrl: z.string().meta({ label: "Discussion URL" }),
		commentId: z.coerce.string().meta({ label: "Comment ID" }),
		parentCommentBody: z
			.string()
			.meta({ label: "Parent Comment Body", input: { multline: true } }),
	}),
} as const satisfies GitHubEvent;

export const githubDiscussionCreatedEvent = {
	id: "github.discussion.created",
	label: "Discussion Created",
	payload: z.object({
		discussionNumber: z.coerce.string().meta({ label: "Discussion Number" }),
		discussionTitle: z.string().meta({ label: "Discussion Title" }),
		discussionBody: z
			.string()
			.meta({ label: "Discussion Body", input: { multline: true } }),
		discussionUrl: z.string().meta({ label: "Discussion URL" }),
		categoryName: z.string().meta({ label: "Category Name" }),
	}),
} as const satisfies GitHubEvent;

export const githubPullRequestClosedEvent = {
	id: "github.pull_request.closed",
	label: "Pull Request Closed",
	payload: z.object({
		title: z.string().meta({ label: "Pull Request Title" }),
		body: z
			.string()
			.meta({ label: "Pull Request Body", input: { multline: true } }),
		number: z.coerce.string().meta({ label: "Pull Request Number" }),
		diff: z.string().meta({ label: "Pull Request Diff" }),
		pullRequestUrl: z.string().meta({ label: "Pull Request URL" }),
	}),
} as const satisfies GitHubEvent;

export const githubPullRequestLabeledEvent = {
	id: "github.pull_request.labeled",
	label: "Pull Request Labeled",
	payload: z.object({
		pullRequestTitle: z.string().meta({ label: "Pull Request Title" }),
		pullRequestBody: z
			.string()
			.meta({ label: "Pull Request Body", input: { multline: true } }),
		pullRequestNumber: z.coerce.string().meta({ label: "Pull Request Number" }),
		labelName: z.string().meta({ label: "Pull Request Label Name" }),
	}),
} as const satisfies GitHubEvent;

export const githubPullRequestOpenedEvent = {
	id: "github.pull_request.opened",
	label: "Pull Request Opened",
	payload: z.object({
		title: z.string().meta({ label: "Pull Request Title" }),
		body: z
			.string()
			.meta({ label: "Pull Request Body", input: { multline: true } }),
		number: z.coerce.string().meta({ label: "Pull Request Number" }),
		diff: z.string().meta({ label: "Pull Request Diff" }),
		pullRequestUrl: z.string().meta({ label: "Pull Request URL" }),
	}),
} as const satisfies GitHubEvent;

export const githubPullRequestReadyForReviewEvent = {
	id: "github.pull_request.ready_for_review",
	label: "Pull Request Ready for Review",
	payload: z.object({
		title: z.string().meta({ label: "Pull Request Title" }),
		body: z
			.string()
			.meta({ label: "Pull Request Body", input: { multline: true } }),
		number: z.coerce.string().meta({ label: "Pull Request Number" }),
		diff: z.string().meta({ label: "Pull Request Diff" }),
		pullRequestUrl: z.string().meta({ label: "Pull Request URL" }),
	}),
} as const satisfies GitHubEvent;

export const githubEvents = {
	[githubIssueCreatedEvent.id]: githubIssueCreatedEvent,
	[githubIssueClosedEvent.id]: githubIssueClosedEvent,
	[githubIssueCommentCreatedEvent.id]: githubIssueCommentCreatedEvent,
	[githubIssueLabeledEvent.id]: githubIssueLabeledEvent,
	[githubPullRequestCommentCreatedEvent.id]:
		githubPullRequestCommentCreatedEvent,
	[githubPullRequestReviewCommentCreatedEvent.id]:
		githubPullRequestReviewCommentCreatedEvent,
	[githubDiscussionCommentCreatedEvent.id]: githubDiscussionCommentCreatedEvent,
	[githubDiscussionCreatedEvent.id]: githubDiscussionCreatedEvent,
	[githubPullRequestClosedEvent.id]: githubPullRequestClosedEvent,
	[githubPullRequestLabeledEvent.id]: githubPullRequestLabeledEvent,
	[githubPullRequestOpenedEvent.id]: githubPullRequestOpenedEvent,
	[githubPullRequestReadyForReviewEvent.id]:
		githubPullRequestReadyForReviewEvent,
};

export type GitHubEventId = keyof typeof githubEvents;

export const githubEventEntries = Object.values(githubEvents);

export function isGitHubEventId(id: string): id is GitHubEventId {
	return id in githubEvents;
}

interface InputData {
	key: string;
	label: string;
	optional?: boolean;
	type: "text" | "multiline-text" | "number";
}
export function githubEventToInputFields(githubAction: GitHubEvent) {
	return githubAction.payload.keyof().options.map((key) => {
		const fieldSchema = githubAction.payload.shape[key] as
			| z.ZodString
			| z.ZodNumber;
		const fieldMeta = PayloadFieldMeta.parse(fieldSchema.meta());
		const label = fieldMeta.label ?? titleCase(key);
		const optional = fieldSchema.safeParse(undefined).success;
		const zodType = fieldSchema.def.type;
		return {
			key,
			label,
			optional,
			type:
				zodType === "string"
					? fieldMeta.input?.multiline
						? "multiline-text"
						: "text"
					: "number",
		} satisfies InputData;
	});
}
