import { z } from "zod/v4";
import type { TriggerBase } from "./base";

export const provider = "github" as const;
interface GitHubTrigger extends TriggerBase {
	provider: typeof provider;
}

const githubIssueCreatedTrigger = {
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

const githubIssueClosedTrigger = {
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

const githubIssueCommentCreatedTrigger = {
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

const githubIssueLabeledTrigger = {
	provider,
	event: {
		id: "github.issue.labeled",
		label: "Issue Labeled",
		payloads: z.object({
			issueNumber: z.number(),
			title: z.string(),
			body: z.string(),
			labelName: z.string(),
		}),
		conditions: z.object({
			labels: z.array(z.string()).min(1),
		}),
	},
} as const satisfies GitHubTrigger;

const githubPullRequestCommentCreatedTrigger = {
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

const githubPullRequestReviewCommentCreatedTrigger = {
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

const githubPullRequestOpenedTrigger = {
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

const githubPullRequestReadyForReviewTrigger = {
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

const githubPullRequestClosedTrigger = {
	provider,
	event: {
		id: "github.pull_request.closed",
		label: "Pull Request Closed",
		payloads: z.object({
			title: z.string(),
			body: z.string(),
			number: z.number(),
			diff: z.string(),
			pullRequestUrl: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

const githubPullRequestLabeledTrigger = {
	provider,
	event: {
		id: "github.pull_request.labeled",
		label: "Pull Request Labeled",
		payloads: z.object({
			pullRequestNumber: z.number(),
			pullRequestTitle: z.string(),
			pullRequestBody: z.string(),
			labelName: z.string(),
		}),
		conditions: z.object({
			labels: z.array(z.string()).min(1),
		}),
	},
} as const satisfies GitHubTrigger;

const githubDiscussionCreatedTrigger = {
	provider,
	event: {
		id: "github.discussion.created",
		label: "Discussion Created",
		payloads: z.object({
			discussionNumber: z.number(),
			discussionTitle: z.string(),
			discussionBody: z.string(),
			discussionUrl: z.string(),
			categoryName: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

const githubDiscussionCommentCreatedTrigger = {
	provider,
	event: {
		id: "github.discussion_comment.created",
		label: "Discussion Comment Created",
		payloads: z.object({
			body: z.string(),
			discussionNumber: z.number(),
			discussionTitle: z.string(),
			discussionBody: z.string(),
			discussionUrl: z.string(),
			commentId: z.number(),
			parentCommentBody: z.string(),
		}),
		conditions: z.object({
			callsign: z.string(),
		}),
	},
} as const satisfies GitHubTrigger;

const githubPayloadLabelOverrides: Partial<
	Record<TriggerEventId, Partial<Record<string, string>>>
> = {
	"github.issue.created": {
		title: "Issue Title",
		body: "Issue Body",
	},
	"github.issue.closed": {
		title: "Issue Title",
		body: "Issue Body",
	},
	"github.issue.labeled": {
		title: "Issue Title",
		body: "Issue Body",
		labelName: "Issue Label Name",
	},
	"github.issue_comment.created": {
		body: "Issue Comment",
	},
	"github.pull_request_comment.created": {
		body: "Pull Request Comment",
		issueNumber: "Pull Request Number",
		issueTitle: "Pull Request Title",
		issueBody: "Pull Request Body",
		diff: "Pull Request Diff",
	},
	"github.pull_request_review_comment.created": {
		body: "Review Comment Body",
		diff: "Review Comment Diff",
		id: "Review Comment ID",
	},
	"github.pull_request.opened": {
		title: "Pull Request Title",
		body: "Pull Request Body",
		number: "Pull Request Number",
		diff: "Pull Request Diff",
	},
	"github.pull_request.ready_for_review": {
		title: "Pull Request Title",
		body: "Pull Request Body",
		number: "Pull Request Number",
		diff: "Pull Request Diff",
	},
	"github.pull_request.closed": {
		title: "Pull Request Title",
		body: "Pull Request Body",
		number: "Pull Request Number",
		diff: "Pull Request Diff",
	},
	"github.pull_request.labeled": {
		labelName: "Pull Request Label Name",
	},
	"github.discussion_comment.created": {
		body: "Comment Body",
	},
};

const uppercaseWords = new Set(["id", "url"]);

function toReadableLabel(value: string) {
	const withSpaces = value.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
	const words = withSpaces.split(/\s+/).filter(Boolean);

	if (words.length === 0) {
		return value;
	}

	return words
		.map((word) => {
			const lower = word.toLowerCase();
			if (uppercaseWords.has(lower)) {
				return lower.toUpperCase();
			}
			return lower.charAt(0).toUpperCase() + lower.slice(1);
		})
		.join(" ");
}

export function getGitHubDisplayLabel(args: {
	eventId: TriggerEventId;
	accessor: string;
}) {
	const eventOverride =
		githubPayloadLabelOverrides[args.eventId]?.[args.accessor];
	if (eventOverride !== undefined) {
		return eventOverride;
	}

	return toReadableLabel(args.accessor);
}

export const triggers = {
	[githubIssueCreatedTrigger.event.id]: githubIssueCreatedTrigger,
	[githubIssueClosedTrigger.event.id]: githubIssueClosedTrigger,
	[githubIssueCommentCreatedTrigger.event.id]: githubIssueCommentCreatedTrigger,
	[githubIssueLabeledTrigger.event.id]: githubIssueLabeledTrigger,
	[githubPullRequestCommentCreatedTrigger.event.id]:
		githubPullRequestCommentCreatedTrigger,
	[githubPullRequestReviewCommentCreatedTrigger.event.id]:
		githubPullRequestReviewCommentCreatedTrigger,
	[githubPullRequestOpenedTrigger.event.id]: githubPullRequestOpenedTrigger,
	[githubPullRequestReadyForReviewTrigger.event.id]:
		githubPullRequestReadyForReviewTrigger,
	[githubPullRequestClosedTrigger.event.id]: githubPullRequestClosedTrigger,
	[githubPullRequestLabeledTrigger.event.id]: githubPullRequestLabeledTrigger,
	[githubDiscussionCreatedTrigger.event.id]: githubDiscussionCreatedTrigger,
	[githubDiscussionCommentCreatedTrigger.event.id]:
		githubDiscussionCommentCreatedTrigger,
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
		case "github.issue.labeled":
			return githubIssueLabeledTrigger.event.label;
		case "github.pull_request.labeled":
			return githubPullRequestLabeledTrigger.event.label;
		case "github.discussion.created":
			return githubDiscussionCreatedTrigger.event.label;
		case "github.discussion_comment.created":
			return githubDiscussionCommentCreatedTrigger.event.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
