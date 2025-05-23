import type { FlowTrigger, GenerationInput } from "@giselle-sdk/data-type";
import type { githubTriggers } from "@giselle-sdk/flow";
import {
	type WebhookEvent,
	ensureWebhookEvent,
	isWebhookEvent,
} from "@giselle-sdk/github-tool";
import { type GitHubEvent, GitHubEventType } from "./events";
import { parseCommand } from "./utils";

interface BuildTriggerInputsArgs {
	githubTrigger: (typeof githubTriggers)[keyof typeof githubTriggers];
	trigger: FlowTrigger;
	webhookEvent: WebhookEvent;
}
export function buildTriggerInputs(
	args: BuildTriggerInputsArgs,
): GenerationInput[] | null {
	const inputs: GenerationInput[] = [
		...buildIssueCreatedInputs(args),
		...buildIssueClosedInputs(args),
		...buildIssueCommentInputs(args),
		...buildPullRequestOpenedInputs(args),
		...buildPullRequestReadyForReviewInputs(args),
		...buildPullRequestClosedInputs(args),
		...buildPullRequestCommentInputs(args),
	];

	return inputs.length > 0 ? inputs : null;
}

function buildIssueCreatedInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issues.opened") ||
		args.githubTrigger.event.id !== "github.issue.created"
	) {
		return [];
	}
	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				inputs.push({
					name: "title",
					value: args.webhookEvent.data.payload.issue.title,
				});
				break;
			case "body":
				inputs.push({
					name: "body",
					value: args.webhookEvent.data.payload.issue.body ?? "",
				});
				break;
			case "issueNumber":
				inputs.push({
					name: "issueNumber",
					value: args.webhookEvent.data.payload.issue.number.toString(),
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function buildIssueClosedInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issues.closed") ||
		args.githubTrigger.event.id !== "github.issue.closed"
	) {
		return [];
	}

	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				inputs.push({
					name: "title",
					value: args.webhookEvent.data.payload.issue.title,
				});
				break;
			case "body":
				inputs.push({
					name: "body",
					value: args.webhookEvent.data.payload.issue.body ?? "",
				});
				break;
			case "issueNumber":
				inputs.push({
					name: "issueNumber",
					value: args.webhookEvent.data.payload.issue.number.toString(),
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function buildIssueCommentInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issue_comment.created") ||
		args.trigger.configuration.event.id !== "github.issue_comment.created" ||
		args.githubTrigger.event.id !== "github.issue_comment.created"
	) {
		return [];
	}

	const command = parseCommand(args.webhookEvent.data.payload.comment.body);
	if (
		command === null ||
		command.callsign !== args.trigger.configuration.event.conditions.callsign
	) {
		return [];
	}

	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "body":
				inputs.push({
					name: "body",
					value: command.content,
				});
				break;
			case "issueBody":
				inputs.push({
					name: "issueBody",
					value: args.webhookEvent.data.payload.issue.body ?? "",
				});
				break;
			case "issueNumber":
				inputs.push({
					name: "issueNumber",
					value: args.webhookEvent.data.payload.issue.number.toString(),
				});
				break;
			case "issueTitle":
				inputs.push({
					name: "issueTitle",
					value: args.webhookEvent.data.payload.issue.title,
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function buildPullRequestOpenedInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.opened") ||
		args.githubTrigger.event.id !== "github.pull_request.opened"
	) {
		return [];
	}

	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				inputs.push({
					name: "title",
					value: args.webhookEvent.data.payload.pull_request.title,
				});
				break;
			case "body":
				inputs.push({
					name: "body",
					value: args.webhookEvent.data.payload.pull_request.body ?? "",
				});
				break;
			case "number":
				inputs.push({
					name: "number",
					value: args.webhookEvent.data.payload.pull_request.number.toString(),
				});
				break;
			case "pullRequestUrl":
				inputs.push({
					name: "pullRequestUrl",
					value: args.webhookEvent.data.payload.pull_request.html_url,
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function buildPullRequestReadyForReviewInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.ready_for_review") ||
		args.githubTrigger.event.id !== "github.pull_request.ready_for_review"
	) {
		return [];
	}

	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				inputs.push({
					name: "title",
					value: args.webhookEvent.data.payload.pull_request.title,
				});
				break;
			case "body":
				inputs.push({
					name: "body",
					value: args.webhookEvent.data.payload.pull_request.body ?? "",
				});
				break;
			case "number":
				inputs.push({
					name: "number",
					value: args.webhookEvent.data.payload.pull_request.number.toString(),
				});
				break;
			case "pullRequestUrl":
				inputs.push({
					name: "pullRequestUrl",
					value: args.webhookEvent.data.payload.pull_request.html_url,
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function buildPullRequestClosedInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "pull_request.closed") ||
		args.githubTrigger.event.id !== "github.pull_request.closed"
	) {
		return [];
	}

	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "title":
				inputs.push({
					name: "title",
					value: args.webhookEvent.data.payload.pull_request.title,
				});
				break;
			case "body":
				inputs.push({
					name: "body",
					value: args.webhookEvent.data.payload.pull_request.body ?? "",
				});
				break;
			case "number":
				inputs.push({
					name: "number",
					value: args.webhookEvent.data.payload.pull_request.number.toString(),
				});
				break;
			case "pullRequestUrl":
				inputs.push({
					name: "pullRequestUrl",
					value: args.webhookEvent.data.payload.pull_request.html_url,
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function buildPullRequestCommentInputs(args: BuildTriggerInputsArgs) {
	if (
		!ensureWebhookEvent(args.webhookEvent, "issue_comment.created") ||
		args.trigger.configuration.event.id !==
			"github.pull_request_comment.created" ||
		args.githubTrigger.event.id !== "github.pull_request_comment.created"
	) {
		return [];
	}

	if (args.webhookEvent.data.payload.issue?.pull_request === null) {
		return [];
	}

	const command = parseCommand(args.webhookEvent.data.payload.comment.body);
	if (
		command === null ||
		command.callsign !== args.trigger.configuration.event.conditions.callsign
	) {
		return [];
	}

	const inputs: GenerationInput[] = [];
	for (const payload of args.githubTrigger.event.payloads.keyof().options) {
		switch (payload) {
			case "body":
				inputs.push({
					name: "body",
					value: command.content,
				});
				break;
			case "issueBody":
				inputs.push({
					name: "issueBody",
					value: args.webhookEvent.data.payload.issue.body ?? "",
				});
				break;
			case "issueNumber":
				inputs.push({
					name: "issueNumber",
					value: args.webhookEvent.data.payload.issue.number.toString(),
				});
				break;
			case "issueTitle":
				inputs.push({
					name: "issueTitle",
					value: args.webhookEvent.data.payload.issue.title,
				});
				break;
			default: {
				const _exhaustiveCheck: never = payload;
				throw new Error(`Unhandled payload id: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}
