import { z } from "zod/v4";
import type { TriggerBase } from "../base";

export const provider = "github" as const;
export interface GitHubTrigger extends TriggerBase {
	provider: typeof provider;
}

export const githubIssueCreatedTrigger = {
	provider,
	event: {
		id: "github.issue.created",
		label: "Issue Created",
		payloads: z.object({
			issueNumber: z.number(),
			title: z.string(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubIssueClosedTrigger = {
	provider,
	event: {
		id: "github.issue.closed",
		label: "Issue Closed",
		payloads: z.object({
			issueNumber: z.number(),
			title: z.string(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubIssueCommentCreatedTrigger = {
	provider,
	event: {
		id: "github.issue_comment.created",
		label: "Issue Comment Created",
		payloads: z.object({
			body: z.string(),
			issueNumber: z.number(),
			issueTitle: z.string(),
			issueBody: z.string(),
		}),
		conditions: z.object({
			callsign: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubPullRequestCommentCreatedTrigger = {
	provider,
	event: {
		id: "github.pull_request_comment.created",
		label: "Pull Request Comment Created",
		payloads: z.object({
			body: z.string(),
			issueNumber: z.number(),
			issueTitle: z.string(),
			issueBody: z.string(),
			diff: z.string(),
		}),
		conditions: z.object({
			callsign: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubPullRequestReviewCommentCreatedTrigger = {
	provider,
	event: {
		id: "github.pull_request_review_comment.created",
		label: "Pull Request Review Comment Created",
		payloads: z.object({
			id: z.number(),
			body: z.string(),
			diff: z.string(),
			previousCommentBody: z.string(),
			pullRequestNumber: z.number(),
			pullRequestTitle: z.string(),
			pullRequestBody: z.string(),
		}),
		conditions: z.object({
			callsign: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubPullRequestOpenedTrigger = {
	provider,
	event: {
		id: "github.pull_request.opened",
		label: "Pull Request Opened",
		payloads: z.object({
			title: z.string(),
			body: z.string(),
			number: z.number(),
			diff: z.string(),
			pullRequestUrl: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubPullRequestReadyForReviewTrigger = {
	provider,
	event: {
		id: "github.pull_request.ready_for_review",
		label: "Pull Request Ready for Review",
		payloads: z.object({
			title: z.string(),
			body: z.string(),
			number: z.number(),
			diff: z.string(),
			pullRequestUrl: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const githubPullRequestClosedTrigger = {
	provider,
	event: {
		id: "github.pull_request.closed",
		label: "Pull Request Closed",
		payloads: z.object({
			title: z.string(),
			body: z.string(),
			number: z.number(),
			pullRequestUrl: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const triggers = {
	[githubIssueCreatedTrigger.event.id]: githubIssueCreatedTrigger,
	[githubIssueClosedTrigger.event.id]: githubIssueClosedTrigger,
	[githubIssueCommentCreatedTrigger.event.id]: githubIssueCommentCreatedTrigger,
	[githubPullRequestCommentCreatedTrigger.event.id]:
		githubPullRequestCommentCreatedTrigger,
	[githubPullRequestReviewCommentCreatedTrigger.event.id]:
		githubPullRequestReviewCommentCreatedTrigger,
	[githubPullRequestOpenedTrigger.event.id]: githubPullRequestOpenedTrigger,
	[githubPullRequestReadyForReviewTrigger.event.id]:
		githubPullRequestReadyForReviewTrigger,
	[githubPullRequestClosedTrigger.event.id]: githubPullRequestClosedTrigger,
} as const;

export type TriggerEventId = keyof typeof triggers;

export function triggerIdToLabel(triggerId: TriggerEventId) {
	switch (triggerId) {
		case "github.issue.created":
			return githubIssueCreatedTrigger.event.label;
		case "github.issue.closed":
			return githubIssueClosedTrigger.event.label;
		case "github.issue_comment.created":
			return githubIssueCommentCreatedTrigger.event.label;
		case "github.pull_request_comment.created":
			return githubPullRequestCommentCreatedTrigger.event.label;
		case "github.pull_request_review_comment.created":
			return githubPullRequestReviewCommentCreatedTrigger.event.label;
		case "github.pull_request.opened":
			return githubPullRequestOpenedTrigger.event.label;
		case "github.pull_request.ready_for_review":
			return githubPullRequestReadyForReviewTrigger.event.label;
		case "github.pull_request.closed":
			return githubPullRequestClosedTrigger.event.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
