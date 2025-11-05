import type { githubTriggers } from "@giselle-ai/flow";
import {
	ensureWebhookEvent,
	getDiscussionComment,
	getPullRequestDiff,
	getPullRequestReviewComment,
	type WebhookEvent,
} from "@giselle-ai/github-tool";
import type { FlowTrigger, Output } from "@giselle-ai/protocol";
import type { GenerationOutput } from "../generations";
import { parseCommand } from "./utils";

interface ResolveTriggerArgs {
	output: Output;
	githubTrigger: (typeof githubTriggers)[keyof typeof githubTriggers];
	trigger: FlowTrigger;
	webhookEvent: WebhookEvent;
	appId: string;
	privateKey: string;
	installationId: number;
}
export async function resolveTrigger(args: ResolveTriggerArgs) {
	return (
		resolveIssueCreatedTrigger(args) ||
		resolveIssueClosedTrigger(args) ||
		resolveIssueLabeledTrigger(args) ||
		resolveIssueCommentTrigger(args) ||
		(await resolvePullRequestOpenedTrigger(args)) ||
		(await resolvePullRequestReadyForReviewTrigger(args)) ||
		(await resolvePullRequestClosedTrigger(args)) ||
		resolvePullRequestLabeledTrigger(args) ||
		(await resolvePullRequestCommentTrigger(args)) ||
		(await resolvePullRequestReviewCommentTrigger(args)) ||
		resolveDiscussionCreatedTrigger(args) ||
		(await resolveDiscussionCommentCreatedTrigger(args))
	);
}

function resolveIssueCreatedTrigger(args: ResolveTriggerArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issues.opened") ||
		args.githubTrigger.event.id !== "github.issue.created"
	) {
		return null;
	}
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.title,
				} satisfies GenerationOutput;
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.body ?? "",
				} satisfies GenerationOutput;
			case "issueNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.number.toString(),
				} satisfies GenerationOutput;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolveIssueClosedTrigger(
	args: ResolveTriggerArgs,
): GenerationOutput | null {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issues.closed") ||
		args.githubTrigger.event.id !== "github.issue.closed"
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.title,
				} satisfies GenerationOutput;
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.body ?? "",
				} satisfies GenerationOutput;
			case "issueNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.number.toString(),
				} satisfies GenerationOutput;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolveIssueLabeledTrigger(args: ResolveTriggerArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issues.labeled") ||
		args.githubTrigger.event.id !== "github.issue.labeled"
	) {
		return null;
	}
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.title,
				} satisfies GenerationOutput;
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.body ?? "",
				} satisfies GenerationOutput;
			case "issueNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.number.toString(),
				} satisfies GenerationOutput;
			case "labelName":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.label?.name ?? "",
				} satisfies GenerationOutput;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolvePullRequestLabeledTrigger(args: ResolveTriggerArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.labeled") ||
		args.githubTrigger.event.id !== "github.pull_request.labeled"
	) {
		return null;
	}
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "pullRequestTitle":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.title,
				} satisfies GenerationOutput;
			case "pullRequestBody":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.body ?? "",
				} satisfies GenerationOutput;
			case "pullRequestNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content:
						args.webhookEvent.data.payload.pull_request.number.toString(),
				} satisfies GenerationOutput;
			case "labelName":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.label?.name ?? "",
				} satisfies GenerationOutput;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolveIssueCommentTrigger(
	args: ResolveTriggerArgs,
): GenerationOutput | null {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issue_comment.created") ||
		args.trigger.configuration.event.id !== "github.issue_comment.created" ||
		args.githubTrigger.event.id !== "github.issue_comment.created"
	) {
		return null;
	}

	const command = parseCommand(args.webhookEvent.data.payload.comment.body);
	if (
		command === null ||
		command.callsign !== args.trigger.configuration.event.conditions.callsign
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: command.content,
				} satisfies GenerationOutput;
			case "issueBody":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.body ?? "",
				} satisfies GenerationOutput;
			case "issueNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.number.toString(),
				} satisfies GenerationOutput;
			case "issueTitle":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.title,
				} satisfies GenerationOutput;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

async function resolvePullRequestOpenedTrigger(
	args: ResolveTriggerArgs,
): Promise<GenerationOutput | null> {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.opened") ||
		args.githubTrigger.event.id !== "github.pull_request.opened" ||
		args.trigger.configuration.provider !== "github"
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.title,
				} satisfies GenerationOutput;
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.body ?? "",
				} satisfies GenerationOutput;
			case "number":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content:
						args.webhookEvent.data.payload.pull_request.number.toString(),
				} satisfies GenerationOutput;
			case "pullRequestUrl":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.html_url,
				} satisfies GenerationOutput;
			case "diff": {
				if (args.output.accessor !== payload) {
					continue;
				}
				const diff = await getPullRequestDiff({
					repositoryNodeId: args.webhookEvent.data.payload.repository.node_id,
					pullNumber: args.webhookEvent.data.payload.pull_request.number,
					authConfig: {
						strategy: "app-installation",
						appId: args.appId,
						privateKey: args.privateKey,
						installationId: args.installationId,
					},
				});
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: diff,
				} satisfies GenerationOutput;
			}
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

async function resolvePullRequestReadyForReviewTrigger(
	args: ResolveTriggerArgs,
): Promise<GenerationOutput | null> {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.ready_for_review") ||
		args.githubTrigger.event.id !== "github.pull_request.ready_for_review" ||
		args.trigger.configuration.provider !== "github"
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.title,
				} satisfies GenerationOutput;
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.body ?? "",
				} satisfies GenerationOutput;
			case "number":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content:
						args.webhookEvent.data.payload.pull_request.number.toString(),
				} satisfies GenerationOutput;
			case "pullRequestUrl":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.html_url,
				} satisfies GenerationOutput;
			case "diff": {
				if (args.output.accessor !== payload) {
					continue;
				}
				const diff = await getPullRequestDiff({
					repositoryNodeId: args.webhookEvent.data.payload.repository.node_id,
					pullNumber: args.webhookEvent.data.payload.pull_request.number,
					authConfig: {
						strategy: "app-installation",
						appId: args.appId,
						privateKey: args.privateKey,
						installationId: args.installationId,
					},
				});
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: diff,
				} satisfies GenerationOutput;
			}
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

async function resolvePullRequestClosedTrigger(
	args: ResolveTriggerArgs,
): Promise<GenerationOutput | null> {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.closed") ||
		args.githubTrigger.event.id !== "github.pull_request.closed"
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.title,
				} satisfies GenerationOutput;
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.body ?? "",
				} satisfies GenerationOutput;
			case "number":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content:
						args.webhookEvent.data.payload.pull_request.number.toString(),
				} satisfies GenerationOutput;
			case "pullRequestUrl":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.html_url,
				} satisfies GenerationOutput;
			case "diff": {
				if (args.output.accessor !== payload) {
					continue;
				}
				const diff = await getPullRequestDiff({
					repositoryNodeId: args.webhookEvent.data.payload.repository.node_id,
					pullNumber: args.webhookEvent.data.payload.pull_request.number,
					authConfig: {
						strategy: "app-installation",
						appId: args.appId,
						privateKey: args.privateKey,
						installationId: args.installationId,
					},
				});
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: diff,
				} satisfies GenerationOutput;
			}
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

async function resolvePullRequestCommentTrigger(
	args: ResolveTriggerArgs,
): Promise<GenerationOutput | null> {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issue_comment.created") ||
		args.trigger.configuration.event.id !==
			"github.pull_request_comment.created" ||
		args.githubTrigger.event.id !== "github.pull_request_comment.created"
	) {
		return null;
	}

	if (args.webhookEvent.data.payload.issue?.pull_request === null) {
		return null;
	}

	const command = parseCommand(args.webhookEvent.data.payload.comment.body);
	if (
		command === null ||
		command.callsign !== args.trigger.configuration.event.conditions.callsign
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: command.content,
				} satisfies GenerationOutput;
			case "issueBody":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.body ?? "",
				} satisfies GenerationOutput;
			case "issueNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.number.toString(),
				} satisfies GenerationOutput;
			case "issueTitle":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.issue.title,
				} satisfies GenerationOutput;
			case "diff": {
				if (args.output.accessor !== payload) {
					continue;
				}
				const diff = await getPullRequestDiff({
					repositoryNodeId: args.webhookEvent.data.payload.repository.node_id,
					pullNumber: args.webhookEvent.data.payload.issue.number,
					authConfig: {
						strategy: "app-installation",
						appId: args.appId,
						privateKey: args.privateKey,
						installationId: args.installationId,
					},
				});
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: diff,
				} satisfies GenerationOutput;
			}
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

async function resolvePullRequestReviewCommentTrigger(
	args: ResolveTriggerArgs,
) {
	if (
		!ensureWebhookEvent(
			args.webhookEvent,
			"pull_request_review_comment.created",
		) ||
		args.trigger.configuration.event.id !==
			"github.pull_request_review_comment.created" ||
		args.githubTrigger.event.id !== "github.pull_request_review_comment.created"
	) {
		return null;
	}

	const command = parseCommand(args.webhookEvent.data.payload.comment.body);
	if (
		command === null ||
		command.callsign !== args.trigger.configuration.event.conditions.callsign
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: command.content,
				} satisfies GenerationOutput;
			case "pullRequestBody":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.body ?? "",
				} satisfies GenerationOutput;
			case "pullRequestNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content:
						args.webhookEvent.data.payload.pull_request.number.toString(),
				} satisfies GenerationOutput;
			case "pullRequestTitle":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.pull_request.title,
				} satisfies GenerationOutput;
			case "diff":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.comment.diff_hunk,
				} satisfies GenerationOutput;
			case "id":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.comment.id.toString(),
				} satisfies GenerationOutput;
			case "previousCommentBody": {
				if (args.output.accessor !== payload) {
					continue;
				}
				if (
					args.webhookEvent.data.payload.comment.in_reply_to_id === undefined
				) {
					return {
						type: "generated-text",
						outputId: args.output.id,
						content: "",
					} satisfies GenerationOutput;
				}
				const comment = await getPullRequestReviewComment({
					repositoryNodeId: args.webhookEvent.data.payload.repository.node_id,
					commentId: args.webhookEvent.data.payload.comment.in_reply_to_id,
					authConfig: {
						strategy: "app-installation",
						appId: args.appId,
						privateKey: args.privateKey,
						installationId: args.installationId,
					},
				});
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: comment.body,
				} satisfies GenerationOutput;
			}
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolveDiscussionCreatedTrigger(args: ResolveTriggerArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "discussion.created") ||
		args.githubTrigger.event.id !== "github.discussion.created"
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "discussionNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.number.toString(),
				} satisfies GenerationOutput;
			case "discussionTitle":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.title,
				} satisfies GenerationOutput;
			case "discussionBody":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.body,
				} satisfies GenerationOutput;
			case "discussionUrl":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.html_url,
				} satisfies GenerationOutput;
			case "categoryName":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.category.name,
				} satisfies GenerationOutput;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

async function resolveDiscussionCommentCreatedTrigger(
	args: ResolveTriggerArgs,
) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "discussion_comment.created") ||
		args.trigger.configuration.event.id !==
			"github.discussion_comment.created" ||
		args.githubTrigger.event.id !== "github.discussion_comment.created"
	) {
		return null;
	}

	const command = parseCommand(args.webhookEvent.data.payload.comment.body);
	if (
		command === null ||
		command.callsign !== args.trigger.configuration.event.conditions.callsign
	) {
		return null;
	}

	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "body":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: command.content,
				} satisfies GenerationOutput;
			case "discussionNumber":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.number.toString(),
				} satisfies GenerationOutput;
			case "discussionTitle":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.title,
				} satisfies GenerationOutput;
			case "discussionBody":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.body,
				} satisfies GenerationOutput;
			case "discussionUrl":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.discussion.html_url,
				} satisfies GenerationOutput;
			case "commentId":
				if (args.output.accessor !== payload) {
					continue;
				}
				return {
					type: "generated-text",
					outputId: args.output.id,
					content: args.webhookEvent.data.payload.comment.id.toString(),
				} satisfies GenerationOutput;
			case "parentCommentBody": {
				if (args.output.accessor !== payload) {
					continue;
				}

				const parentId = args.webhookEvent.data.payload.comment.parent_id;
				if (parentId === null) {
					return {
						type: "generated-text",
						outputId: args.output.id,
						content: "",
					} satisfies GenerationOutput;
				}

				const owner = args.webhookEvent.data.payload.repository.owner.login;
				const name = args.webhookEvent.data.payload.repository.name;
				const discussionNumber =
					args.webhookEvent.data.payload.discussion.number;
				const parentComment = await getDiscussionComment({
					owner,
					name,
					discussionNumber,
					databaseId: parentId,
					authConfig: {
						strategy: "app-installation",
						appId: args.appId,
						privateKey: args.privateKey,
						installationId: args.installationId,
					},
				});

				return {
					type: "generated-text",
					outputId: args.output.id,
					content: parentComment?.body ?? "",
				} satisfies GenerationOutput;
			}
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}
