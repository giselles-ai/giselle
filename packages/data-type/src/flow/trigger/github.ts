import { z } from "zod";

export const Provider = z.literal("github");

const IssueCreated = z.object({
	id: z.literal("github.issue.created"),
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

const PullRequestReadyForReview = z.object({
	id: z.literal("github.pull_request.ready_for_review"),
});

export const GitHubFlowTriggerEvent = z.discriminatedUnion("id", [
	IssueCreated,
	IssueCommentCreated,
	PullRequestCommentCreated,
	PullRequestReadyForReview,
]);
export type GitHubFlowTriggerEvent = z.infer<typeof GitHubFlowTriggerEvent>;

export const GitHubFlowTrigger = z.object({
	provider: Provider,
	event: GitHubFlowTriggerEvent,
	installationId: z.number(),
	repositoryNodeId: z.string(),
});
export type GitHubFlowTrigger = z.infer<typeof GitHubFlowTrigger>;
