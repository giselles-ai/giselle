import {
	type GitHubAuthConfig,
	type WebhookEvent,
	type WebhookEventName,
	addReaction,
	ensureWebhookEvent,
	handleWebhook,
} from "@giselle-sdk/github-tool";
import type { Storage } from "unstorage";
import { runFlow } from "../flows";
import { getFlowTrigger } from "../flows/utils";
import { getGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import type { GiselleEngineContext } from "../types";
import { parseCommand } from "./utils";

const events: WebhookEventName[] = [
	"issues.opened",
	"issues.closed",
	"issue_comment.created",
	"pull_request.opened",
	"pull_request.ready_for_review",
	"pull_request.closed",
	"pull_request_review_comment.created",
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
async function process<TEventName extends WebhookEventName>(args: {
	event: WebhookEvent<TEventName>;
	context: GiselleEngineContext;
}) {
	if (!hasRequiredPayloadProps(args.event)) {
		return;
	}
	const installationId = args.event.data.payload.installation.id;
	const githubRepositoryIntegration = await getGitHubRepositoryIntegrationIndex(
		{
			storage: args.context.storage,
			repositoryNodeId: args.event.data.payload.repository.node_id,
		},
	);

	if (githubRepositoryIntegration === undefined) {
		return;
	}
	await Promise.all(
		githubRepositoryIntegration.flowTriggerIds.map(async (flowTriggerId) => {
			const trigger = await getFlowTrigger({
				storage: args.context.storage,
				flowTriggerId,
			});

			if (!trigger.enable || trigger.configuration.provider !== "github") {
				return;
			}

			const githubAuthV2 = args.context.integrationConfigs?.github?.authV2;
			if (githubAuthV2 === undefined) {
				throw new Error("GitHub authV2 configuration is missing");
			}
			const authConfig = {
				strategy: "app-installation",
				appId: githubAuthV2.appId,
				privateKey: githubAuthV2.privateKey,
				installationId,
			} satisfies GitHubAuthConfig;

			let run = false;

			if (
				ensureWebhookEvent(args.event, "issues.opened") &&
				trigger.configuration.event.id === "github.issue.created"
			) {
				run = true;
				await addReaction({
					id: args.event.data.payload.issue.node_id,
					content: "EYES",
					authConfig,
				});
			}

			if (
				ensureWebhookEvent(args.event, "issues.closed") &&
				trigger.configuration.event.id === "github.issue.closed"
			) {
				run = true;
				await addReaction({
					id: args.event.data.payload.issue.node_id,
					content: "EYES",
					authConfig,
				});
			}

			if (
				ensureWebhookEvent(args.event, "issue_comment.created") &&
				trigger.configuration.event.id === "github.issue_comment.created"
			) {
				const command = parseCommand(args.event.data.payload.comment.body);
				if (
					command?.callsign !== trigger.configuration.event.conditions.callsign
				) {
					return;
				}

				run = true;
				await addReaction({
					id: args.event.data.payload.comment.node_id,
					content: "EYES",
					authConfig,
				});
			}

			if (
				ensureWebhookEvent(args.event, "pull_request_review_comment.created") &&
				trigger.configuration.event.id === "github.pull_request_comment.created"
			) {
				const command = parseCommand(args.event.data.payload.comment.body);
				if (
					command?.callsign !== trigger.configuration.event.conditions.callsign
				) {
					return;
				}

				run = true;
				await addReaction({
					id: args.event.data.payload.comment.node_id,
					content: "EYES",
					authConfig,
				});
			}

			if (
				ensureWebhookEvent(args.event, "pull_request.opened") &&
				trigger.configuration.event.id === "github.pull_request.opened"
			) {
				run = true;
				await addReaction({
					id: args.event.data.payload.pull_request.node_id,
					content: "EYES",
					authConfig,
				});
			}

			if (
				ensureWebhookEvent(args.event, "pull_request.ready_for_review") &&
				trigger.configuration.event.id ===
					"github.pull_request.ready_for_review"
			) {
				run = true;
				await addReaction({
					id: args.event.data.payload.pull_request.node_id,
					content: "EYES",
					authConfig,
				});
			}

			if (
				ensureWebhookEvent(args.event, "pull_request.closed") &&
				trigger.configuration.event.id === "github.pull_request.closed"
			) {
				run = true;
				await addReaction({
					id: args.event.data.payload.pull_request.node_id,
					content: "EYES",
					authConfig,
				});
			}
			if (run) {
				runFlow({
					context: args.context,
					triggerId: trigger.id,
					payload: args.event,
				});
			}
		}),
	);
}
