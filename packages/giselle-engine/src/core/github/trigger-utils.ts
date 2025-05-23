import type {
	FlowTrigger,
	GenerationContextInput,
	GenerationOutput,
	Output,
} from "@giselle-sdk/data-type";
import type { githubTriggers } from "@giselle-sdk/flow";
import {
	type WebhookEvent,
	ensureWebhookEvent,
	isWebhookEvent,
} from "@giselle-sdk/github-tool";
import { type GitHubEvent, GitHubEventType } from "./events";
import { parseCommand } from "./utils";

interface ResolveTriggerArgs {
	output: Output;
	githubTrigger: (typeof githubTriggers)[keyof typeof githubTriggers];
	trigger: FlowTrigger;
	webhookEvent: WebhookEvent;
}
export function resolveTrigger(args: ResolveTriggerArgs) {
	return (
		resolveIssueCreatedTrigger(args) ||
		resolveIssueClosedTrigger(args) ||
		resolveIssueCommentTrigger(args) ||
		resolvePullRequestOpenedTrigger(args) ||
		resolvePullRequestReadyForReviewTrigger(args) ||
		resolvePullRequestClosedTrigger(args) ||
		resolvePullRequestCommentTrigger(args)
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

	console.log(args.githubTrigger.event.payloads.keyof().options);
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		console.log(payload);
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

function resolvePullRequestOpenedTrigger(
	args: ResolveTriggerArgs,
): GenerationOutput | null {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.opened") ||
		args.githubTrigger.event.id !== "github.pull_request.opened"
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
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolvePullRequestReadyForReviewTrigger(
	args: ResolveTriggerArgs,
): GenerationOutput | null {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.ready_for_review") ||
		args.githubTrigger.event.id !== "github.pull_request.ready_for_review"
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
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolvePullRequestClosedTrigger(
	args: ResolveTriggerArgs,
): GenerationOutput | null {
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
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}

function resolvePullRequestCommentTrigger(
	args: ResolveTriggerArgs,
): GenerationOutput | null {
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
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return null;
}
