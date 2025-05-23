import type { FlowTrigger } from "@giselle-sdk/data-type";
import type {
	GitHubAuthConfig,
	WebhookEvent,
	WebhookEventName,
	addReaction,
	createIssueComment,
	ensureWebhookEvent,
	updateIssueComment,
} from "@giselle-sdk/github-tool";
import type { runFlow } from "../flows";
import type { GiselleEngineContext } from "../types";
import type { parseCommand } from "./utils";

export interface EventHandlerDependencies {
	addReaction: typeof addReaction;
	ensureWebhookEvent: typeof ensureWebhookEvent;
	runFlow: typeof runFlow;
	parseCommand: typeof parseCommand;
	createIssueComment: typeof createIssueComment;
	updateIssueComment: typeof updateIssueComment;
}

export type EventHandlerArgs<TEventName extends WebhookEventName> = {
	event: WebhookEvent<TEventName>;
	context: GiselleEngineContext;
	trigger: FlowTrigger;
	authConfig: GitHubAuthConfig;
	deps: EventHandlerDependencies;
};

export type EventHandlerResult = {
	shouldRun: boolean;
	reactionNodeId?: string;
	commentTarget?: {
		repositoryNodeId: string;
		issueNumber: number;
	};
};

export async function handleIssueOpened<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): Promise<EventHandlerResult> {
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

	const issueNumber = (issue as { number?: number }).number;
	const commentTarget =
		issueNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber,
				}
			: undefined;
	return {
		shouldRun: true,
		reactionNodeId: issue.node_id,
		commentTarget,
	};
}

export async function handleIssueClosed<TEventName extends WebhookEventName>(
	args: EventHandlerArgs<TEventName>,
): Promise<EventHandlerResult> {
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

	const issueNumber = (issue as { number?: number }).number;
	const commentTarget =
		issueNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber,
				}
			: undefined;

	return {
		shouldRun: true,
		reactionNodeId: issue.node_id,
		commentTarget,
	};
}

export async function handleIssueCommentCreated<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): Promise<EventHandlerResult> {
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

	const issueNumber = (args.event.data.payload.issue as { number?: number })
		?.number;
	const commentTarget =
		issueNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber,
				}
			: undefined;

	return {
		shouldRun: true,
		reactionNodeId: comment.node_id,
		commentTarget,
	};
}

export async function handlePullRequestCommentCreated<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): Promise<EventHandlerResult> {
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

	const issueNumber = (args.event.data.payload.issue as { number?: number })
		?.number;
	const commentTarget =
		issueNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber,
				}
			: undefined;

	return {
		shouldRun: true,
		reactionNodeId: args.event.data.payload.comment.node_id,
		commentTarget,
	};
}

export async function handlePullRequestOpened<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): Promise<EventHandlerResult> {
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

	const pullNumber = (pullRequest as { number?: number }).number;
	const commentTarget =
		pullNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber: pullNumber,
				}
			: undefined;

	return {
		shouldRun: true,
		reactionNodeId: pullRequest.node_id,
		commentTarget,
	};
}

export async function handlePullRequestReadyForReview<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): Promise<EventHandlerResult> {
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

	const pullNumber = (pullRequest as { number?: number }).number;
	const commentTarget =
		pullNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber: pullNumber,
				}
			: undefined;

	return {
		shouldRun: true,
		reactionNodeId: pullRequest.node_id,
		commentTarget,
	};
}

export async function handlePullRequestClosed<
	TEventName extends WebhookEventName,
>(args: EventHandlerArgs<TEventName>): Promise<EventHandlerResult> {
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

	const pullNumber = (pullRequest as { number?: number }).number;
	const commentTarget =
		pullNumber !== undefined
			? {
					repositoryNodeId: args.event.data.payload.repository.node_id,
					issueNumber: pullNumber,
				}
			: undefined;

	return {
		shouldRun: true,
		reactionNodeId: pullRequest.node_id,
		commentTarget,
	};
}

export const eventHandlers = [
	handleIssueOpened,
	handleIssueClosed,
	handleIssueCommentCreated,
	handlePullRequestCommentCreated,
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
): Promise<boolean> {
	if (
		!args.trigger.enable ||
		args.trigger.configuration.provider !== "github"
	) {
		return false;
	}

	const installationId = args.trigger.configuration.installationId;
	const authConfig = args.createAuthConfig(installationId);

	// Merge provided dependencies with defaults
	const deps = { ...args.deps };

	for (const handler of eventHandlers) {
		const result = await handler({
			...args,
			authConfig,
			deps,
		});

		if (result.reactionNodeId) {
			await deps.addReaction({
				id: result.reactionNodeId,
				content: "EYES",
				authConfig,
			});
		}

		if (result.shouldRun) {
			let commentId: number | undefined;
			if (result.commentTarget) {
				const comment = await deps.createIssueComment({
					repositoryNodeId: result.commentTarget.repositoryNodeId,
					issueNumber: result.commentTarget.issueNumber,
					body: "Running flow...",
					authConfig,
				});
				commentId = (comment as { id?: number }).id;
			}

			await deps.runFlow({
				context: args.context,
				triggerId: args.trigger.id,
				payload: args.event,
				onStep: async ({ step, totalSteps }) => {
					if (commentId !== undefined && result.commentTarget) {
						await deps.updateIssueComment({
							repositoryNodeId: result.commentTarget.repositoryNodeId,
							commentId,
							body: `Running flow... (${step}/${totalSteps})`,
							authConfig,
						});
					}
				},
			});

			if (commentId !== undefined && result.commentTarget) {
				await deps.updateIssueComment({
					repositoryNodeId: result.commentTarget.repositoryNodeId,
					commentId,
					body: "Flow completed",
					authConfig,
				});
			}

			return true;
		}
	}

	return false;
}
