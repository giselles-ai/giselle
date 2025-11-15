import type {
	addReaction,
	createDiscussionComment,
	createIssueComment,
	createPullRequestComment,
	ensureWebhookEvent,
	GitHubAuthConfig,
	getDiscussionForCommentCreation,
	replyPullRequestReviewComment,
	updateDiscussionComment,
	updateIssueComment,
	updatePullRequestReviewComment,
	WebhookEvent,
	WebhookEventName,
} from "@giselles-ai/github-tool";
import { findDiscussionReplyTargetId } from "@giselles-ai/github-tool";
import type { Trigger } from "@giselles-ai/protocol";
import type { createAndStartAct } from "../acts";
import type { GiselleContext } from "../types";
import { getWorkspace } from "../workspaces";
import type { parseCommand } from "./utils";

interface MiniStepProgressTableRow {
	id: string;
	name: string;
	status: "pending" | "in-progress" | "success" | "failed";
	updatedAt: Date | undefined;
}

// Since we can't access node information from the new Act structure,
// we'll simplify the progress tracking
type ProgressTableRow = {
	id: string;
	status: "pending" | "in-progress" | "success" | "failed";
	updatedAt: Date | undefined;
	miniStepProgressTableRows: MiniStepProgressTableRow[];
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

function mapStepStatusToMiniStepStatus(
	status:
		| "created"
		| "queued"
		| "running"
		| "completed"
		| "failed"
		| "cancelled",
): "pending" | "in-progress" | "success" | "failed" {
	switch (status) {
		case "created":
		case "queued":
			return "pending";
		case "running":
			return "in-progress";
		case "completed":
			return "success";
		case "failed":
		case "cancelled":
			return "failed";
		default: {
			const _exhaustiveCheck: never = status;
			throw new Error(`Unhandled step status: ${_exhaustiveCheck}`);
		}
	}
}

function buildProgressTable(data: ProgressTableData) {
	const rows = data.map((row, i) => {
		const miniStepRows = row.miniStepProgressTableRows.map((miniStep) => {
			let miniStepStatusIcon = "";
			let miniStepStatusText = "";
			switch (miniStep.status) {
				case "pending":
					miniStepStatusIcon = "⚪";
					miniStepStatusText = "Pending";
					break;
				case "in-progress":
					miniStepStatusIcon = "⏳";
					miniStepStatusText = "In progress";
					break;
				case "success":
					miniStepStatusIcon = "🟢";
					miniStepStatusText = "Success";
					break;
				case "failed":
					miniStepStatusIcon = "❌";
					miniStepStatusText = "Failed";
					break;
				default: {
					const _exhaustiveCheck: never = miniStep.status;
					throw new Error(`Unhandled miniStep status: ${_exhaustiveCheck}`);
				}
			}

			const miniStepUpdatedAtText = miniStep.updatedAt
				? formatDateTime(miniStep.updatedAt)
				: "Not started";
			const miniStepDetailsContent = `Status: ${miniStepStatusText}\nUpdated: ${miniStepUpdatedAtText}`;

			return `<tr><td>${miniStepStatusIcon}</td><td><details><summary><strong>${miniStep.name}</strong></summary>${miniStepDetailsContent}</details></td></tr>`;
		});

		return `<tr><td colspan='2'><strong>Step ${i + 1}</strong></td></tr>
${miniStepRows.length > 0 ? miniStepRows.join("\n") : ""}`;
	});
	return `<table><tbody>${rows.join("\n")}</tbody></table>`;
}

export interface EventHandlerDependencies {
	addReaction: typeof addReaction;
	ensureWebhookEvent: typeof ensureWebhookEvent;
	createAndStartAct: typeof createAndStartAct;
	parseCommand: typeof parseCommand;
	createIssueComment: typeof createIssueComment;
	createPullRequestComment: typeof createPullRequestComment;
	replyPullRequestReviewComment: typeof replyPullRequestReviewComment;
	updateIssueComment: typeof updateIssueComment;
	updatePullRequestReviewComment: typeof updatePullRequestReviewComment;
	createDiscussionComment: typeof createDiscussionComment;
	updateDiscussionComment: typeof updateDiscussionComment;
	getDiscussionForCommentCreation: typeof getDiscussionForCommentCreation;
}

export type EventHandlerArgs<TEventName extends WebhookEventName> = {
	event: WebhookEvent<TEventName>;
	context: GiselleContext;
	trigger: Trigger;
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

export function handleIssueLabeled<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "issues.labeled") ||
		args.trigger.configuration.event.id !== "github.issue.labeled"
	) {
		return { shouldRun: false };
	}

	const issue = args.event.data.payload.issue;
	const addedLabel = args.event.data.payload.label;

	if (!issue || !addedLabel) {
		return { shouldRun: false };
	}

	const conditions =
		args.trigger.configuration.event.id === "github.issue.labeled"
			? args.trigger.configuration.event.conditions
			: undefined;

	if (!conditions?.labels || !Array.isArray(conditions.labels)) {
		return { shouldRun: false };
	}

	const shouldRun = conditions.labels.includes(addedLabel.name);

	return shouldRun
		? { shouldRun: true, reactionNodeId: issue.node_id }
		: { shouldRun: false };
}

export function handlePullRequestLabeled<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "pull_request.labeled") ||
		args.trigger.configuration.event.id !== "github.pull_request.labeled"
	) {
		return { shouldRun: false };
	}

	const pullRequest = args.event.data.payload.pull_request;
	const addedLabel = args.event.data.payload.label;

	if (!pullRequest || !addedLabel) {
		return { shouldRun: false };
	}

	const conditions =
		args.trigger.configuration.event.id === "github.pull_request.labeled"
			? args.trigger.configuration.event.conditions
			: undefined;

	if (!conditions?.labels || !Array.isArray(conditions.labels)) {
		return { shouldRun: false };
	}

	const shouldRun = conditions.labels.includes(addedLabel.name);

	return shouldRun
		? { shouldRun: true, reactionNodeId: pullRequest.node_id }
		: { shouldRun: false };
}

export function handleDiscussionCreated<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "discussion.created") ||
		args.trigger.configuration.event.id !== "github.discussion.created"
	) {
		return { shouldRun: false };
	}

	const discussion = args.event.data.payload.discussion;
	if (!discussion) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: discussion.node_id };
}

export function handleDiscussionCommentCreated<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): EventHandlerResult {
	if (
		!args.deps.ensureWebhookEvent(args.event, "discussion_comment.created") ||
		args.trigger.configuration.event.id !== "github.discussion_comment.created"
	) {
		return { shouldRun: false };
	}

	const comment = args.event.data.payload.comment;
	if (!comment) {
		return { shouldRun: false };
	}

	const command = args.deps.parseCommand(comment.body);
	const conditions = args.trigger.configuration.event.conditions;

	if (command?.callsign !== conditions.callsign) {
		return { shouldRun: false };
	}

	return { shouldRun: true, reactionNodeId: comment.node_id };
}

const eventHandlers = [
	handleIssueOpened,
	handleIssueClosed,
	handleIssueCommentCreated,
	handleIssueLabeled,
	handlePullRequestCommentCreated,
	handlePullRequestReviewCommentCreated,
	handlePullRequestOpened,
	handlePullRequestReadyForReview,
	handlePullRequestClosed,
	handlePullRequestLabeled,
	handleDiscussionCreated,
	handleDiscussionCommentCreated,
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

		let createdComment:
			| { id: number; type: "issue" | "review" }
			| { id: string; type: "discussion" }
			| undefined;
		const updateComment = async (body: string) => {
			if (!createdComment) return;
			if (createdComment.type === "issue") {
				await deps.updateIssueComment({
					repositoryNodeId,
					commentId: createdComment.id,
					body,
					authConfig,
				});
			} else if (createdComment.type === "review") {
				await deps.updatePullRequestReviewComment({
					repositoryNodeId,
					commentId: createdComment.id,
					body,
					authConfig,
				});
			} else if (createdComment.type === "discussion") {
				await deps.updateDiscussionComment({
					commentId: createdComment.id,
					body,
					authConfig,
				});
			}
		};

		let progressTableData: ProgressTableData = [];
		let hasFlowError = false;

		const workspace = await getWorkspace({
			context: args.context,
			workspaceId: args.trigger.workspaceId,
		});

		await deps.createAndStartAct({
			context: args.context,
			nodeId: args.trigger.nodeId,
			workspace,
			generationOriginType: "github-app",
			inputs: [
				{
					type: "github-webhook-event",
					webhookEvent: args.event,
				},
			],
			callbacks: {
				actCreate: async ({ act }) => {
					progressTableData = act.sequences.map((sequence) => ({
						id: sequence.id,
						status: "pending" as const,
						updatedAt: undefined,
						miniStepProgressTableRows: sequence.steps.map((step) => ({
							id: step.id,
							name: step.name,
							status: mapStepStatusToMiniStepStatus(step.status),
							updatedAt: undefined,
						})),
					}));

					const body = `Running flow...\n\n${buildProgressTable(progressTableData)}`;

					if (
						deps.ensureWebhookEvent(args.event, "issue_comment.created") ||
						deps.ensureWebhookEvent(args.event, "issues.opened") ||
						deps.ensureWebhookEvent(args.event, "issues.closed") ||
						deps.ensureWebhookEvent(args.event, "issues.labeled")
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
						deps.ensureWebhookEvent(args.event, "pull_request.closed") ||
						deps.ensureWebhookEvent(args.event, "pull_request.labeled")
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
					} else if (
						deps.ensureWebhookEvent(args.event, "discussion.created") ||
						deps.ensureWebhookEvent(args.event, "discussion_comment.created")
					) {
						const discussionPayload = args.event.data.payload.discussion;
						const discussionId = discussionPayload.node_id;
						let replyToId: string | undefined;
						if (
							deps.ensureWebhookEvent(args.event, "discussion_comment.created")
						) {
							const parentDatabaseId =
								args.event.data.payload.comment.parent_id;
							if (parentDatabaseId !== null) {
								const owner = args.event.data.payload.repository.owner.login;
								const name = args.event.data.payload.repository.name;
								const discussionNumber = discussionPayload.number;
								const discussionForCommentCreation =
									await deps.getDiscussionForCommentCreation({
										owner,
										name,
										number: discussionNumber,
										authConfig,
									});
								const commentNodes =
									discussionForCommentCreation.data?.repository?.discussion
										?.comments?.nodes ?? [];
								replyToId = findDiscussionReplyTargetId({
									comments: commentNodes,
									targetDatabaseId: parentDatabaseId,
								});
							} else {
								replyToId = args.event.data.payload.comment.node_id;
							}
						}
						const comment = await deps.createDiscussionComment({
							discussionId,
							body,
							replyToId,
							authConfig,
						});
						if (comment?.id) {
							createdComment = {
								type: "discussion",
								id: comment.id,
							};
						}
					}
				},
				sequenceStart: async ({ sequence }) => {
					const now = new Date();
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? {
									...row,
									status: "in-progress" as const,
									updatedAt: now,
									miniStepProgressTableRows: sequence.steps.map((step) => {
										const existingMiniStep = row.miniStepProgressTableRows.find(
											(ms) => ms.id === step.id,
										);
										const newStatus = mapStepStatusToMiniStepStatus(
											step.status,
										);
										const shouldUpdateTime =
											step.status === "running" ||
											(newStatus === "in-progress" &&
												existingMiniStep?.status !== "in-progress");
										return {
											id: step.id,
											name: step.name,
											status: newStatus,
											updatedAt: shouldUpdateTime
												? now
												: (existingMiniStep?.updatedAt ?? undefined),
										};
									}),
								}
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
				sequenceComplete: async ({ sequence }) => {
					const now = new Date();
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? {
									...row,
									status: "success" as const,
									updatedAt: now,
									miniStepProgressTableRows: sequence.steps.map((step) => ({
										id: step.id,
										name: step.name,
										status: mapStepStatusToMiniStepStatus(step.status),
										updatedAt:
											step.status === "completed" ||
											step.status === "failed" ||
											step.status === "cancelled"
												? now
												: undefined,
									})),
								}
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
				sequenceFail: async ({ sequence }) => {
					hasFlowError = true;
					const now = new Date();
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? {
									...row,
									status: "failed",
									updatedAt: now,
									miniStepProgressTableRows: sequence.steps.map((step) => ({
										id: step.id,
										name: step.name,
										status: mapStepStatusToMiniStepStatus(step.status),
										updatedAt:
											step.status === "completed" ||
											step.status === "failed" ||
											step.status === "cancelled"
												? now
												: undefined,
									})),
								}
							: row,
					);
					await updateComment(
						`Running flow...\n\n${buildProgressTable(progressTableData)}`,
					);
				},
				sequenceSkip: async ({ sequence }) => {
					const now = new Date();
					progressTableData = progressTableData.map((row) =>
						row.id === sequence.id
							? {
									...row,
									status: "failed" as const,
									updatedAt: now,
									miniStepProgressTableRows: sequence.steps.map((step) => ({
										id: step.id,
										name: step.name,
										status: mapStepStatusToMiniStepStatus(step.status),
										updatedAt:
											step.status === "completed" ||
											step.status === "failed" ||
											step.status === "cancelled"
												? now
												: undefined,
									})),
								}
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
