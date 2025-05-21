// packages/giselle-engine/src/core/github/types.ts

import type {
	IssueCommentCreatedEvent,
	IssuesClosedEvent,
	IssuesOpenedEvent,
	PullRequestClosedEvent,
	PullRequestCommentCreatedEvent,
	PullRequestOpenedEvent,
	PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";

export enum GitHubEventType {
	ISSUE_COMMENT_CREATED = "issue_comment.created",
	ISSUES_OPENED = "issues.opened",
	ISSUES_CLOSED = "issues.closed",
	PULL_REQUEST_OPENED = "pull_request.opened",
	PULL_REQUEST_READY_FOR_REVIEW = "pull_request.ready_for_review",
	PULL_REQUEST_CLOSED = "pull_request.closed",
	PULL_REQUEST_COMMENT_CREATED = "pull_request_comment.created",
}

export type GitHubEvent =
	| {
			type: GitHubEventType.ISSUE_COMMENT_CREATED;
			event: "issue_comment";
			payload: IssueCommentCreatedEvent;
	  }
	| {
			type: GitHubEventType.ISSUES_OPENED;
			event: "issues";
			payload: IssuesOpenedEvent;
	  }
	| {
			type: GitHubEventType.ISSUES_CLOSED;
			event: "issues";
			payload: IssuesClosedEvent;
	  }
	| {
			type: GitHubEventType.PULL_REQUEST_OPENED;
			event: "pull_request";
			payload: PullRequestOpenedEvent;
	  }
	| {
			type: GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW;
			event: "pull_request";
			payload: PullRequestReadyForReviewEvent;
	  }
	| {
			type: GitHubEventType.PULL_REQUEST_CLOSED;
			event: "pull_request";
			payload: PullRequestClosedEvent;
	  }
	// Extended type to support new events without full type checking
	| {
			type: string;
			event: string;
			payload: any;
	  };
