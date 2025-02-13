import { db } from "@/drizzle";
import { saveAgentActivity } from "@/services/agents/activities";
import { reportAgentTimeUsage } from "@/services/usage-based-billing";
import { executeStep } from "@giselles-ai/lib/execution";
import { performFlowExecution } from "@giselles-ai/lib/runner";
import {
	createExecutionId,
	createInitialJobExecutions,
} from "@giselles-ai/lib/utils";
import type { Execution, Graph } from "@giselles-ai/types";
import type { Octokit } from "@octokit/core";
import { waitUntil } from "@vercel/functions";
import { parseCommand } from "./command";
import {
	assertIssueCommentEvent,
	createOctokit,
	notifyWorkflowError,
} from "./utils";

export class WebhookPayloadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PayloadError";
		Object.setPrototypeOf(this, WebhookPayloadError.prototype);
	}
}

interface GitHubClientFactory {
	createClient(installationId: number): Promise<Octokit>;
}

export const defaultGitHubClientFactory: GitHubClientFactory = {
	createClient: async (installationId: number) => {
		return await createOctokit(installationId);
	},
};

export const mockGitHubClientFactory: GitHubClientFactory = {
	createClient: async (installationId: number) =>
		({
			// biome-ignore lint/suspicious/noExplicitAny: mock
			request: async (route: string, params?: any) => {
				console.log("Mock GitHub API call:", { route, params });
				return {
					data: {
						id: "mock-comment-id",
						body: params?.body,
					},
				};
			},
		}) as Octokit,
};

/**
 * Handle GitHub webhook event
 * ref: https://docs.github.com/en/webhooks/webhook-events-and-payloads
 * @param event
 * @returns
 */
export async function handleEvent(
	event: { id: string; name: string; payload: unknown },
	options: { githubClientFactory: GitHubClientFactory },
): Promise<void> {
	switch (event.name) {
		case "installation":
		case "installation_repositories":
			// All GitHub Apps receive these events.
			console.info(`received event: ${event.name}`);
			break;
		case "issue_comment":
			await handleIssueComment(event, options);
			break;
		default:
			throw new WebhookPayloadError(`Unsupported event name: ${event.name}`);
	}
}

async function handleIssueComment(
	event: { id: string; name: string; payload: unknown },
	options: { githubClientFactory: GitHubClientFactory },
) {
	try {
		assertIssueCommentEvent(event);
	} catch (e: unknown) {
		throw new WebhookPayloadError(`Invalid issue comment event: ${e}`);
	}

	const payload = event.payload;
	const command = parseCommand(payload.comment.body);
	if (command === null) {
		// nothing to do
		return;
	}
	if (payload.installation === undefined) {
		throw new WebhookPayloadError(
			`Installation not found. payload: ${JSON.stringify(payload)}`,
		);
	}

	const githubClientFactory = options.githubClientFactory;
	const octokit = await githubClientFactory.createClient(
		payload.installation.id,
	);

	const integrationSettings = await db.query.githubIntegrationSettings.findMany(
		{
			where: (gitHubIntegrationSettings, { eq, and }) =>
				and(
					eq(
						gitHubIntegrationSettings.repositoryFullName,
						payload.repository.full_name,
					),
					eq(gitHubIntegrationSettings.callSign, command.callSign),
				),
		},
	);

	waitUntil(
		Promise.all(
			integrationSettings.map(async (integrationSetting) => {
				const agent = await db.query.agents.findFirst({
					where: (agents, { eq }) =>
						eq(agents.dbId, integrationSetting.agentDbId),
				});
				if (agent === undefined || agent.graphUrl === null) {
					return;
				}
				const graph = await fetch(agent.graphUrl).then(
					(res) => res.json() as unknown as Graph,
				);
				const flow = graph.flows.find(
					(flow) => flow.id === integrationSetting.flowId,
				);
				if (flow === undefined) {
					console.warn(
						`GitHubIntegrationSetting: ${integrationSetting.id}, flow not found`,
					);
					return;
				}
				const executionId = createExecutionId();
				const jobExecutions = createInitialJobExecutions(flow);
				const flowRunStartedAt = Date.now();

				let initialExecution: Execution = {
					id: executionId,
					status: "running",
					flowId: flow.id,
					jobExecutions,
					artifacts: [],
					runStartedAt: flowRunStartedAt,
				};

				const overrideData = integrationSetting.eventNodeMappings
					.map((eventNodeMapping) => {
						switch (eventNodeMapping.event) {
							case "comment.body":
								return {
									nodeId: eventNodeMapping.nodeId,
									data: command.content,
								};
							case "issue.title":
								return {
									nodeId: eventNodeMapping.nodeId,
									data: payload.issue.title,
								};
							case "issue.body":
								if (payload.issue.body === null) {
									return null;
								}
								return {
									nodeId: eventNodeMapping.nodeId,
									data: payload.issue.body,
								};
							default:
								return null;
						}
					})
					.filter((overrideData) => overrideData !== null);
				const finalExecution = await performFlowExecution({
					initialExecution,
					executeStepFn: (stepId) =>
						executeStep({
							agentId: agent.id,
							flowId: flow.id,
							executionId: executionId,
							stepId: stepId,
							artifacts: initialExecution.artifacts,
							overrideData,
						}),
					onExecutionChange: (execution) => {
						initialExecution = execution;
					},
					onFinish: async ({ endedAt, durationMs, execution }) => {
						const startedAtDate = new Date(execution.runStartedAt);
						const endedAtDate = new Date(endedAt);
						await saveAgentActivity(
							agent.id,
							startedAtDate,
							endedAtDate,
							durationMs,
						);
						await reportAgentTimeUsage(agent.id, endedAtDate);
					},
					onStepFail: async (stepExecution) => {
						await notifyWorkflowError(agent, stepExecution.error);
					},
				});
				if (finalExecution.status === "completed") {
					await octokit.request(
						"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
						{
							owner: payload.repository.owner.login,
							repo: payload.repository.name,
							issue_number: payload.issue.number,
							body: finalExecution.artifacts[
								finalExecution.artifacts.length - 1
							].object.content,
						},
					);
				}
			}),
		),
	);
}
