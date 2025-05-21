import { z } from "zod";
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

export const githubPullRequestReadyForReviewTrigger = {
	provider,
	event: {
		id: "github.pull_request.ready_for_review",
		label: "Pull Request Ready for Review",
		payloads: z.object({
			title: z.string(),
			body: z.string(),
			number: z.number(),
			pullRequestUrl: z.string(),
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
			pullRequestNumber: z.number(),
			pullRequestTitle: z.string(),
			pullRequestBody: z.string(),
		}),
		conditions: z.object({
			callsign: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

export const triggers = {
	[githubIssueCreatedTrigger.event.id]: githubIssueCreatedTrigger,
	[githubIssueCommentCreatedTrigger.event.id]: githubIssueCommentCreatedTrigger,
	[githubPullRequestReadyForReviewTrigger.event.id]:
		githubPullRequestReadyForReviewTrigger,
	[githubPullRequestCommentCreatedTrigger.event.id]:
		githubPullRequestCommentCreatedTrigger,
} as const;

export type TriggerEventId = keyof typeof triggers;

export function triggerIdToLabel(triggerId: TriggerEventId) {
	switch (triggerId) {
		case "github.issue.created":
			return githubIssueCreatedTrigger.event.label;
		case "github.issue_comment.created":
			return githubIssueCommentCreatedTrigger.event.label;
		case "github.pull_request.ready_for_review":
			return githubPullRequestReadyForReviewTrigger.event.label;
		case "github.pull_request_comment.created":
			return githubPullRequestCommentCreatedTrigger.event.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
