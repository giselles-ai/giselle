import { z } from "zod/v4";

const Provider = z.literal("github");

export const GitHubTriggerEventIssueCreated = z.object({
	id: z.literal("github.issue.created"),
});

export const GitHubTriggerEventIssueClosed = z.object({
	id: z.literal("github.issue.closed"),
});

export const GitHubTriggerEventIssueCommentCreated = z.object({
	id: z.literal("github.issue_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubTriggerEventIssueLabeled = z.object({
	id: z.literal("github.issue.labeled"),
	conditions: z.object({
		labels: z.array(z.string()).min(1),
	}),
});

export const GitHubTriggerEventPullRequestCommentCreated = z.object({
	id: z.literal("github.pull_request_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubTriggerEventPullRequestReviewCommentCreated = z.object({
	id: z.literal("github.pull_request_review_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});
export const GitHubTriggerEventPullRequestOpened = z.object({
	id: z.literal("github.pull_request.opened"),
});

export const GitHubTriggerEventPullRequestReadyForReview = z.object({
	id: z.literal("github.pull_request.ready_for_review"),
});

export const GitHubTriggerEventPullRequestClosed = z.object({
	id: z.literal("github.pull_request.closed"),
});

export const GitHubTriggerEventPullRequestLabeled = z.object({
	id: z.literal("github.pull_request.labeled"),
	conditions: z.object({
		labels: z.array(z.string()).min(1),
	}),
});

export const GitHubTriggerEventDiscussionCreated = z.object({
	id: z.literal("github.discussion.created"),
});

export const GitHubTriggerEventDiscussionCommentCreated = z.object({
	id: z.literal("github.discussion_comment.created"),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubTriggerEvent = z.discriminatedUnion("id", [
	GitHubTriggerEventIssueCreated,
	GitHubTriggerEventIssueClosed,
	GitHubTriggerEventIssueCommentCreated,
	GitHubTriggerEventIssueLabeled,
	GitHubTriggerEventPullRequestCommentCreated,
	GitHubTriggerEventPullRequestReviewCommentCreated,
	GitHubTriggerEventPullRequestOpened,
	GitHubTriggerEventPullRequestReadyForReview,
	GitHubTriggerEventPullRequestClosed,
	GitHubTriggerEventPullRequestLabeled,
	GitHubTriggerEventDiscussionCreated,
	GitHubTriggerEventDiscussionCommentCreated,
]);
export type GitHubTriggerEvent = z.infer<typeof GitHubTriggerEvent>;

export const GitHubTriggerEventId = z.union(
	GitHubTriggerEvent.options.map((option) => option.shape.id),
);
export type GitHubTriggerEventId = z.infer<typeof GitHubTriggerEventId>;

export const GitHubTrigger = z.object({
	provider: Provider,
	event: GitHubTriggerEvent,
	installationId: z.number(),
	repositoryNodeId: z.string(),
});
export type GitHubTrigger = z.infer<typeof GitHubTrigger>;
