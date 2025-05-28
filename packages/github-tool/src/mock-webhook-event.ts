export const supportedWebhookEventNames = [
	"issues.opened",
	"issues.closed",
	"issue_comment.created",
	"pull_request_review_comment.created",
	"pull_request.opened",
	"pull_request.ready_for_review",
	"pull_request.closed",
] as const;

export type SupportedWebhookEventName =
	(typeof supportedWebhookEventNames)[number];

import type { WebhookEvent } from "./webhooks";

interface MockOptions {
	installationId?: number;
	repositoryNodeId?: string;
	issueNodeId?: string;
	pullRequestNodeId?: string;
	commentNodeId?: string;
	commentBody?: string;
}

/**
 * Create a minimal GitHub webhook event for tests.
 */
export function mockWebhookEvent<T extends SupportedWebhookEventName>(
	name: T,
	options: MockOptions = {},
): WebhookEvent<T> {
	const action = name.split(".")[1];
	const payload: Record<string, unknown> = {
		action,
		installation: { id: options.installationId ?? 1 },
		repository: { node_id: options.repositoryNodeId ?? "repo-node-id" },
	};

	switch (name) {
		case "issues.opened":
		case "issues.closed":
			payload.issue = { node_id: options.issueNodeId ?? "issue-node-id" };
			break;
		case "issue_comment.created":
			payload.comment = {
				node_id: options.commentNodeId ?? "comment-node-id",
				body: options.commentBody ?? "",
			};
			break;
		case "pull_request_review_comment.created":
			payload.pull_request = {
				node_id: options.pullRequestNodeId ?? "pr-node-id",
			};
			payload.comment = {
				node_id: options.commentNodeId ?? "comment-node-id",
				body: options.commentBody ?? "",
			};
			break;
		case "pull_request.opened":
		case "pull_request.ready_for_review":
		case "pull_request.closed":
			payload.pull_request = {
				node_id: options.pullRequestNodeId ?? "pr-node-id",
			};
			break;
	}

	return {
		name,
		data: {
			id: "1",
			name: name.split(".")[0] as unknown as string,
			payload,
		} as unknown as WebhookEvent<T>["data"],
	};
}
