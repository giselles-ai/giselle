import {
	type FlowTrigger,
	isTriggerNode,
	type Sequence,
} from "@giselle-sdk/data-type";
import type {
	addReaction,
	createIssueComment,
	createPullRequestComment,
	ensureWebhookEvent,
	GitHubAuthConfig,
	replyPullRequestReviewComment,
	updateIssueComment,
	updatePullRequestReviewComment,
	WebhookEvent,
	WebhookEventName,
} from "@giselle-sdk/github-tool";
import type { createAndRunFlow } from "../flows";
import type { GiselleEngineContext } from "../types";
import type { parseCommand } from "./utils";

type ProgressTableRow = Sequence & {
	status: "queued" | "running" | "complete" | "failed" | "skipped";
	updatedAt: Date | undefined;
};
type ProgressTableData = ProgressTableRow[];
function formatDateTime(date: Date): string {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const month = months[date.getUTCMonth()];
	const day = date.getUTCDate();
	const year = date.getUTCFullYear();
	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();

	const period = hours >= 12 ? "pm" : "am";
	const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
	const displayMinutes = minutes.toString().padStart(2, "0");

	return `${month} ${day}, ${year} ${displayHours}:${displayMinutes}${period}`;
}

function buildProgressTable(data: ProgressTableData) {
	const header = "| Step | Nodes | Status | Updated(UTC) |";
	const separator = "| --- | --- | --- | --- |";
	const rows = data.map((row, i) => {
		const names = row.steps
			.map((step) => step.node.name ?? step.node.id)
			.join(", ");
		let status = "";
		switch (row.status) {
			case "queued":
				status = "--";
				break;
			case "running":
				status = "⏳";
				break;
			case "complete":
				status = "✅";
				break;
			case "failed":
				status = "❌";
				break;
			case "skipped":
				status = "--";
				break;
			default: {
				const _exhaustiveCheck: never = row.status;
				throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
			}
		}

		return `| ${i + 1} | ${names} | ${status} | ${row.updatedAt ? formatDateTime(row.updatedAt) : "--"} |`;
	});
	return [header, separator, ...rows].join("\n");
}

export interface EventHandlerDependencies {
	addReaction: typeof addReaction;
	ensureWebhookEvent: typeof ensureWebhookEvent;
	createAndRunFlow: typeof createAndRunFlow;
	parseCommand: typeof parseCommand;
	createIssueComment: typeof createIssueComment;
	createPullRequestComment: typeof createPullRequestComment;
	replyPullRequestReviewComment: typeof replyPullRequestReviewComment;
	updateIssueComment: typeof updateIssueComment;
	updatePullRequestReviewComment: typeof updatePullRequestReviewComment;
}

export type EventHandlerArgs<TEventName extends WebhookEventName> = {
	event: WebhookEvent<TEventName>;
	context: GiselleEngineContext;
	trigger: FlowTrigger;
	authConfig: GitHubAuthConfig;
	deps: EventHandlerDependencies;
};

type EventHandlerResult = {
	shouldRun: boolean;
	reactionNodeId?: string;
};

export function handleIssueOpened<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "issues.opened") ||
		args.trigger.configuration.event.id !== "github.issue.created"
	) {
		return { shouldRun: false };
	}

	const issue = args.event.data.payload.issue;
	if (!issue) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: issue.node_id };
}

export function handleIssueClosed<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "issues.closed") ||
		args.trigger.configuration.event.id !== "github.issue.closed"
	) {
		return { shouldRun: false };
	}

	const issue = args.event.data.payload.issue;
	if (!issue) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: issue.node_id };
}

export function handleIssueCommentCreated<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "issue_comment.created") ||
		args.trigger.configuration.event.id !== "github.issue_comment.created"
	) {
		return { shouldRun: false };
	}

	const comment = args.event.data.payload.comment;
	if (!comment) {
		return { shouldRun: false };
	}

	const command = args.deps.parseCommand(comment.body);
	const conditions =
		args.trigger.configuration.event.id === "github.issue_comment.created"
			? args.trigger.configuration.event.conditions
			: undefined;

	if (command?.callsign !== conditions?.callsign) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: comment.node_id };
}

export function handlePullRequestCommentCreated<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "issue_comment.created") ||
		args.trigger.configuration.event.id !==
			"github.pull_request_comment.created"
	) {
		return { shouldRun: false };
	}
	if (args.event.data.payload.issue?.pull_request === null) {
		return { shouldRun: false };
	}

	const command = args.deps.parseCommand(args.event.data.payload.comment.body);
	const conditions =
		args.trigger.configuration.event.id ===
		"github.pull_request_comment.created"
			? args.trigger.configuration.event.conditions
			: undefined;

	if (command?.callsign !== conditions?.callsign) {
		return { shouldRun: false };
	}

	return {
		shouldRun: true,
		reactionNodeId: args.event.data.payload.comment.node_id,
	};
}

export function handlePullRequestReviewCommentCreated<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(
			args.event,
			"pull_request_review_comment.created",
		) ||
		args.trigger.configuration.event.id !==
			"github.pull_request_review_comment.created"
	) {
		return { shouldRun: false };
	}

	const comment = args.event.data.payload.comment;
	if (!comment) {
		return { shouldRun: false };
	}

	const command = args.deps.parseCommand(comment.body);
	const conditions =
		args.trigger.configuration.event.id ===
		"github.pull_request_review_comment.created"
			? args.trigger.configuration.event.conditions
			: undefined;

	if (command?.callsign !== conditions?.callsign) {
		return { shouldRun: false };
	}

	return {
		shouldRun: true,
		reactionNodeId: comment.node_id,
	};
}

export function handlePullRequestOpened<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "pull_request.opened") ||
		args.trigger.configuration.event.id !== "github.pull_request.opened"
	) {
		return { shouldRun: false };
	}

	const pullRequest = args.event.data.payload.pull_request;
	if (!pullRequest) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: pullRequest.node_id };
}

export function handlePullRequestReadyForReview<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(
			args.event,
			"pull_request.ready_for_review",
		) ||
		args.trigger.configuration.event.id !==
			"github.pull_request.ready_for_review"
	) {
		return { shouldRun: false };
	}

	const pullRequest = args.event.data.payload.pull_request;
	if (!pullRequest) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: pullRequest.node_id };
}

export function handlePullRequestClosed<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "pull_request.closed") ||
		args.trigger.configuration.event.id !== "github.pull_request.closed"
	) {
		return { shouldRun: false };
	}

	const pullRequest = args.event.data.payload.pull_request;
	if (!pullRequest) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: pullRequest.node_id };
}

const eventHandlers = [
	handleIssueOpened,
	handleIssueClosed,
	handleIssueCommentCreated,
	handlePullRequestCommentCreated,
	handlePullRequestReviewCommentCreated,
	handlePullRequestOpened,
	handlePullRequestReadyForReview,
	handlePullRequestClosed,
];

export async function processEvent<TEventName extends WebhookEventName>(
	args: Omit<
		EventHandlerArgs<TEventName>,
		"trigger" | "authConfig" | "deps"
	> & {
		trigger: EventHandlerArgs<TEventName>["trigger"];
		createAuthConfig: (installationId: number) => GitHubAuthConfig;
		deps: EventHandlerDependencies;
	},
) {
	if (
		!args.trigger.enable ||
		args.trigger.configuration.provider !== "github"
	) {
		return false;
	}

	const repositoryNodeId = args.trigger.configuration.repositoryNodeId;
	const installationId = args.trigger.configuration.installationId;
	const authConfig = args.createAuthConfig(installationId);

	// Merge provided dependencies with defaults
	const deps = { ...args.deps };

	for (const handler of eventHandlers) {
		const result = handler({
			...args,
			authConfig,
			deps,
		});
		if (!result.shouldRun) {
			continue;
		}

		if (result.reactionNodeId) {
			await deps.addReaction({
				id: result.reactionNodeId,
				content: "EYES",
				authConfig,
			});
		}

		let createdComment: { id: number; type: "issue" | "review" } | undefined;
		const updateComment = async (body: string) => {
			if (!createdComment) return;
			if (createdComment.type === "issue") {
				await deps.updateIssueComment({
					repositoryNodeId,
					commentId: createdComment.id,
					body,
					authConfig,
				});
			} else {
				await deps.updatePullRequestReviewComment({
					repositoryNodeId,
					commentId: createdComment.id,
					body,
					authConfig,
				});
			}
		};

		let progressTableData: ProgressTableData = [];
		let hasFlowError = false;

		await deps.createAndRunFlow({
			useExperimentalStorage: false,
			context: args.context,
			triggerId: args.trigger.id,
			triggerInputs: [
				{
					type: "github-webhook-event",
					webhookEvent: args.event,
				},
			],
			callbacks: {
				flowCreate: async ({ flow }) => {
					progressTableData = flow.sequences
						.filter(
							(sequence) =>
								!sequence.steps.some((step) => isTriggerNode(step.node)),
						)
						.map((sequence) => ({
							...sequence,
							status: "queued",
							updatedAt: undefined,
						}));

					const body = `Running flow...\n\n${buildProgressTable(progressTableData)}`;

					if (
						deps.ensureWebhookEvent(args.event, "issue_comment.created") ||
						deps.ensureWebhookEvent(args.event, "issues.opened") ||
						deps.ensureWebhookEvent(args.event, "issues.closed")
					) {
						const issueNumber = args.event.data.payload.issue.number;
						const comment = await deps.createIssueComment({
							repositoryNodeId,
							issueNumber,
							body,
							authConfig,
						});
						createdComment = { id: comment.id, type: "issue" };
					} else if (
						deps.ensureWebhookEvent(args.event, "pull_request.opened") ||
						deps.ensureWebhookEvent(
							args.event,
							"pull_request.ready_for_review",
						) ||
						deps.ensureWebhookEvent(args.event, "pull_request.closed")
					) {
						const pullNumber = args.event.data.payload.pull_request.number;
						const comment = await deps.createPullRequestComment({
							repositoryNodeId,
							pullNumber,
							body,
							authConfig,
						});
						createdComment = { id: comment.id, type: "issue" };
					} else if (
						deps.ensureWebhookEvent(
							args.event,
							"pull_request_review_comment.created",
						)
					) {
						const pullNumber = args.event.data.payload.pull_request.number;
						const comment = await deps.replyPullRequestReviewComment({
							repositoryNodeId,
							pullNumber,
							commentId: args.event.data.payload.comment.id,
							body,
							authConfig,
						});
						createdComment = { id: comment.id, type: "review" };
					}
				},
				sequenceStart: async ({ sequence }) => {
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? { ...row, status: "running", updatedAt: new Date() }
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
				sequenceComplete: async ({ sequence }) => {
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? { ...row, status: "complete", updatedAt: new Date() }
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
				sequenceFail: async ({ sequence }) => {
					hasFlowError = true;
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? { ...row, status: "failed", updatedAt: new Date() }
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
				sequenceSkip: async ({ sequence }) => {
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? { ...row, status: "skipped", updatedAt: new Date() }
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
			},
		});
		const greeting = hasFlowError
			? "Unexpected error on running flow"
			: "Finished running flow.";
		await updateComment(
			`${greeting}\n\n${buildProgressTable(progressTableData)}`,
		);
	}
}
