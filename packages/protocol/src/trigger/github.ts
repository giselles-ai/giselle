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

const GitHubIssueCreatedEventData = z.object({
	id: z.literal(githubIssueCreatedEvent.id),
});

const GitHubEventIssueClosedData = z.object({
	id: z.literal(githubIssueClosedEvent.id),
});

const GitHubEventIssueCommentCreatedData = z.object({
	id: z.literal(githubIssueCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});

const GitHubEventIssueLabeledData = z.object({
	id: z.literal(githubIssueLabeledEvent.id),
	conditions: z.object({
		labels: z.array(z.string()).min(1),
	}),
});

const GitHubEventPullRequestCommentCreatedData = z.object({
	id: z.literal(githubPullRequestCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});

const GitHubEventPullRequestReviewCommentCreatedData = z.object({
	id: z.literal(githubPullRequestReviewCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});
const GitHubEventPullRequestOpenedData = z.object({
	id: z.literal(githubPullRequestOpenedEvent.id),
});

const GitHubEventPullRequestReadyForReviewData = z.object({
	id: z.literal(githubPullRequestReadyForReviewEvent.id),
});

const GitHubEventPullRequestClosedData = z.object({
	id: z.literal(githubPullRequestClosedEvent.id),
});

const GitHubEventPullRequestLabeledData = z.object({
	id: z.literal(githubPullRequestLabeledEvent.id),
	conditions: z.object({
		labels: z.array(z.string()).min(1),
	}),
});

const GitHubEventDiscussionCreatedData = z.object({
	id: z.literal(githubDiscussionCreatedEvent.id),
});

const GitHubEventDiscussionCommentCreatedData = z.object({
	id: z.literal(githubDiscussionCommentCreatedEvent.id),
	conditions: z.object({
		callsign: z.string(),
	}),
});

export const GitHubEventData = z.discriminatedUnion("id", [
	GitHubIssueCreatedEventData,
	GitHubEventIssueClosedData,
	GitHubEventIssueCommentCreatedData,
	GitHubEventIssueLabeledData,
	GitHubEventPullRequestCommentCreatedData,
	GitHubEventPullRequestReviewCommentCreatedData,
	GitHubEventPullRequestOpenedData,
	GitHubEventPullRequestReadyForReviewData,
	GitHubEventPullRequestClosedData,
	GitHubEventPullRequestLabeledData,
	GitHubEventDiscussionCreatedData,
	GitHubEventDiscussionCommentCreatedData,
]);
export type GitHubEventData = z.infer<typeof GitHubEventData>;

export const GitHubEventConfiguration = z.object({
	provider: Provider,
	event: GitHubEventData,
	installationId: z.number(),
	repositoryNodeId: z.string(),
});
export type GitHubEventConfiguration = z.infer<typeof GitHubEventConfiguration>;
