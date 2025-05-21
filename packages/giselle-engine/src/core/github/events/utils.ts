import type {
	IssueCommentCreatedEvent,
	IssuesClosedEvent,
	IssuesOpenedEvent,
	PullRequestClosedEvent,
	PullRequestCommentCreatedEvent,
	PullRequestOpenedEvent,
	PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";
import { GitHubEventTypeExtensions } from "./augment";
import { type GitHubEvent, GitHubEventType } from "./types";

function isIssueCommentCreatedPayload(
	event: string,
	payload: unknown,
): payload is IssueCommentCreatedEvent {
	return (
		event === "issue_comment" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "created" &&
		"comment" in payload &&
		typeof payload.comment === "object" &&
		payload.comment !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isIssuesOpenedPayload(
	event: string,
	payload: unknown,
): payload is IssuesOpenedEvent {
	return (
		event === "issues" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "opened" &&
		"issue" in payload &&
		typeof payload.issue === "object" &&
		payload.issue !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isIssuesClosedPayload(
	event: string,
	payload: unknown,
): payload is IssuesClosedEvent {
	return (
		event === "issues" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "closed" &&
		"issue" in payload &&
		typeof payload.issue === "object" &&
		payload.issue !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestOpenedPayload(
	event: string,
	payload: unknown,
): payload is PullRequestOpenedEvent {
	return (
		event === "pull_request" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "opened" &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestReadyForReviewPayload(
	event: string,
	payload: unknown,
): payload is PullRequestReadyForReviewEvent {
	return (
		event === "pull_request" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "ready_for_review" &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestClosedPayload(
	event: string,
	payload: unknown,
): payload is PullRequestClosedEvent {
	return (
		event === "pull_request" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "closed" &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestCommentCreatedPayload(
	event: string,
	payload: unknown,
): payload is PullRequestCommentCreatedEvent {
	return (
		event === "pull_request_review_comment" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "created" &&
		"comment" in payload &&
		typeof payload.comment === "object" &&
		payload.comment !== null &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

export function determineGitHubEvent(
	event: string,
	payload: unknown,
): GitHubEvent | null {
	if (isIssueCommentCreatedPayload(event, payload)) {
		return {
			type: GitHubEventType.ISSUE_COMMENT_CREATED,
			event: "issue_comment",
			payload,
		};
	}

	if (isIssuesOpenedPayload(event, payload)) {
		return {
			type: GitHubEventType.ISSUES_OPENED,
			event: "issues",
			payload,
		};
	}

	if (isIssuesClosedPayload(event, payload)) {
		return {
			type: GitHubEventType.ISSUES_CLOSED,
			event: "issues",
			payload,
		};
	}

	if (isPullRequestOpenedPayload(event, payload)) {
		return {
			type: GitHubEventType.PULL_REQUEST_OPENED,
			event: "pull_request",
			payload,
		};
	}

	if (isPullRequestReadyForReviewPayload(event, payload)) {
		return {
			type: GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW,
			event: "pull_request",
			payload,
		};
	}

	if (isPullRequestClosedPayload(event, payload)) {
		return {
			type: GitHubEventType.PULL_REQUEST_CLOSED,
			event: "pull_request",
			payload,
		};
	}

	if (isPullRequestCommentCreatedPayload(event, payload)) {
		return {
			type: GitHubEventTypeExtensions.PULL_REQUEST_COMMENT_CREATED as any,
			event: "pull_request_review_comment",
			payload,
		};
	}

	return null;
}
