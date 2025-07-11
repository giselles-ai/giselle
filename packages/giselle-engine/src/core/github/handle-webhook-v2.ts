import {
	addReaction,
	createIssueComment,
	createPullRequestComment,
	ensureWebhookEvent,
	type GitHubAuthConfig,
	handleWebhook,
	replyPullRequestReviewComment,
	updateIssueComment,
	updatePullRequestReviewComment,
	type WebhookEvent,
	type WebhookEventName,
} from "@giselle-sdk/github-tool";
import { runFlow } from "../flows";
import { getFlowTrigger } from "../flows/utils";
import { getGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import type { GiselleEngineContext } from "../types";
import { type EventHandlerDependencies, processEvent } from "./event-handlers";
import { parseCommand } from "./utils";

const events: WebhookEventName[] = [
	"issues.opened",
	"issues.closed",
	"issue_comment.created",
	"pull_request_review_comment.created",
	"pull_request.opened",
	"pull_request.ready_for_review",
	"pull_request.closed",
];

export async function handleGitHubWebhookV2(args: {
	context: GiselleEngineContext;
	request: Request;
}) {
	const credentials = args.context.integrationConfigs?.github?.authV2;
	if (credentials === undefined) {
		throw new Error("GitHub credentials not found");
	}
	const dispatch = async (
		event: WebhookEvent<WebhookEventName>,
	): Promise<void> =>
		process({
			event,
			context: args.context,
			deps: {
				getFlowTrigger,
				getGitHubRepositoryIntegrationIndex,
				addReaction,
				ensureWebhookEvent,
				runFlow,
				parseCommand,
				createIssueComment,
				createPullRequestComment,
				updateIssueComment,
				updatePullRequestReviewComment,
				replyPullRequestReviewComment,
			},
		});

	const handlers: Partial<
		Record<
			WebhookEventName,
			(event: WebhookEvent<WebhookEventName>) => Promise<void>
		>
	> = {};
	for (const eventName of events) {
		// biome-ignore lint: lint/suspicious/noExplicitAny: Casting to match handler type
		handlers[eventName] = dispatch as any;
	}

	await handleWebhook({
		secret: credentials.webhookSecret,
		request: args.request,
		on: handlers,
	});
}

function hasRequiredPayloadProps(event: unknown): event is {
	data: {
		payload: { repository: { node_id: string }; installation: { id: number } };
	};
} {
	return (
		typeof event === "object" &&
		event !== null &&
		"data" in event &&
		event.data !== null &&
		typeof event.data === "object" &&
		"payload" in event.data &&
		event.data.payload !== null &&
		typeof event.data.payload === "object" &&
		"repository" in event.data.payload &&
		typeof event.data.payload.repository === "object" &&
		event.data.payload.repository !== null &&
		"node_id" in event.data.payload.repository &&
		typeof event.data.payload.repository.node_id === "string" &&
		"installation" in event.data.payload &&
		event.data.payload.installation !== null &&
		typeof event.data.payload.installation === "object" &&
		"id" in event.data.payload.installation
	);
}
interface ProcessDeps {
	getFlowTrigger: typeof getFlowTrigger;
	getGitHubRepositoryIntegrationIndex: typeof getGitHubRepositoryIntegrationIndex;
}

async function process<TEventName extends WebhookEventName>(args: {
	event: WebhookEvent<TEventName>;
	context: GiselleEngineContext;
	deps: ProcessDeps & EventHandlerDependencies;
}) {
	if (!hasRequiredPayloadProps(args.event)) {
		return;
	}

	const githubRepositoryIntegration =
		await args.deps.getGitHubRepositoryIntegrationIndex({
			storage: args.context.storage,
			repositoryNodeId: args.event.data.payload.repository.node_id,
		});

	if (githubRepositoryIntegration === undefined) {
		return;
	}

	await Promise.all(
		githubRepositoryIntegration.flowTriggerIds.map(async (flowTriggerId) => {
			const trigger = await args.deps.getFlowTrigger({
				storage: args.context.storage,
				flowTriggerId,
			});
			if (trigger === undefined) {
				return;
			}

			const githubAuthV2 = args.context.integrationConfigs?.github?.authV2;
			if (githubAuthV2 === undefined) {
				throw new Error("GitHub authV2 configuration is missing");
			}

			const createAuthConfig = (installationId: number): GitHubAuthConfig => ({
				strategy: "app-installation",
				appId: githubAuthV2.appId,
				privateKey: githubAuthV2.privateKey,
				installationId,
			});

			try {
				await processEvent({
					event: args.event,
					context: args.context,
					trigger,
					createAuthConfig,
					deps: args.deps,
				});
			} catch (error) {
				console.error(
					`processEvent failed for workspaceId=${trigger.workspaceId} nodeId=${trigger.nodeId}:`,
					error,
				);
			}
		}),
	);
}
