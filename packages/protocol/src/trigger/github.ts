import {
	githubDiscussionCommentCreatedEvent,
	githubDiscussionCreatedEvent,
	githubIssueClosedEvent,
	githubIssueCommentCreatedEvent,
	githubIssueCreatedEvent,
	githubIssueLabeledEvent,
	githubPullRequestClosedEvent,
	githubPullRequestCommentCreatedEvent,
	githubPullRequestLabeledEvent,
	githubPullRequestOpenedEvent,
	githubPullRequestReadyForReviewEvent,
	githubPullRequestReviewCommentCreatedEvent,
} from "@giselles-ai/trigger-registry";
import { z } from "zod/v4";

const Provider = z.literal("github");

export const GitHubIssueCreatedEvent = z.object({
	id: z.literal(githubIssueCreatedEvent.id),
});

export const GitHubEventIssueClosed = z.object({
	id: z.literal(githubIssueClosedEvent.id),
});

export const GitHubEventIssueCommentCreated = z.object({
	id: z.literal(githubIssueCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubEventIssueLabeled = z.object({
	id: z.literal(githubIssueLabeledEvent.id),
	conditions: z.object({
		labels: z.array(z.string()).min(1),
	}),
});

export const GitHubEventPullRequestCommentCreated = z.object({
	id: z.literal(githubPullRequestCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubEventPullRequestReviewCommentCreated = z.object({
	id: z.literal(githubPullRequestReviewCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});
export const GitHubEventPullRequestOpened = z.object({
	id: z.literal(githubPullRequestOpenedEvent.id),
});

export const GitHubEventPullRequestReadyForReview = z.object({
	id: z.literal(githubPullRequestReadyForReviewEvent.id),
});

export const GitHubEventPullRequestClosed = z.object({
	id: z.literal(githubPullRequestClosedEvent.id),
});

export const GitHubEventPullRequestLabeled = z.object({
	id: z.literal(githubPullRequestLabeledEvent.id),
	conditions: z.object({
		labels: z.array(z.string()).min(1),
	}),
});

export const GitHubEventDiscussionCreated = z.object({
	id: z.literal(githubDiscussionCreatedEvent.id),
});

export const GitHubEventDiscussionCommentCreated = z.object({
	id: z.literal(githubDiscussionCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubEvent = z.discriminatedUnion("id", [
	GitHubIssueCreatedEvent,
	GitHubEventIssueClosed,
	GitHubEventIssueCommentCreated,
	GitHubEventIssueLabeled,
	GitHubEventPullRequestCommentCreated,
	GitHubEventPullRequestReviewCommentCreated,
	GitHubEventPullRequestOpened,
	GitHubEventPullRequestReadyForReview,
	GitHubEventPullRequestClosed,
	GitHubEventPullRequestLabeled,
	GitHubEventDiscussionCreated,
	GitHubEventDiscussionCommentCreated,
]);
export type GitHubEvent = z.infer<typeof GitHubEvent>;

export const GitHubEventConfiguration = z.object({
	provider: Provider,
	event: GitHubEvent,
	installationId: z.number(),
	repositoryNodeId: z.string(),
});
export type GitHubEventConfiguration = z.infer<typeof GitHubEvent>;
