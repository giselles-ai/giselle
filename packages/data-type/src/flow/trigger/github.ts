import { z } from "zod/v4";

const Provider = z.literal("github");

const IssueCreated = z.object({
	id: z.literal("github.issue.created"),
});

const IssueClosed = z.object({
	id: z.literal("github.issue.closed"),
});

const IssueCommentCreated = z.object({
	id: z.literal("github.issue_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});

const PullRequestCommentCreated = z.object({
	id: z.literal("github.pull_request_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});

const PullRequestReviewCommentCreated = z.object({
	id: z.literal("github.pull_request_review_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});
const PullRequestOpened = z.object({
	id: z.literal("github.pull_request.opened"),
});

const PullRequestReadyForReview = z.object({
	id: z.literal("github.pull_request.ready_for_review"),
});

const PullRequestClosed = z.object({
	id: z.literal("github.pull_request.closed"),
});

export const GitHubFlowTriggerEvent = z.discriminatedUnion("id", [
	IssueCreated,
	IssueClosed,
	IssueCommentCreated,
	PullRequestCommentCreated,
	PullRequestReviewCommentCreated,
	PullRequestOpened,
	PullRequestReadyForReview,
	PullRequestClosed,
]);
export type GitHubFlowTriggerEvent = z.infer<typeof GitHubFlowTriggerEvent>;

export const GitHubFlowTrigger = z.object({
	provider: Provider,
	event: GitHubFlowTriggerEvent,
	installationId: z.number(),
	repositoryNodeId: z.string(),
});
export type GitHubFlowTrigger = z.infer<typeof GitHubFlowTrigger>;
