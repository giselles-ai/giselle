import { db } from "@/drizzle";
import { Webhooks } from "@octokit/webhooks";
import type { WebhookEventName } from "@octokit/webhooks-types";
import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { executeStep } from "../../(playground)/p/[agentId]/lib/execution";
import { performFlowExecution } from "../../(playground)/p/[agentId]/lib/runner";
import {
	createExecutionId,
	createInitialJobExecutions,
} from "../../(playground)/p/[agentId]/lib/utils";
import type { Execution, Graph } from "../../(playground)/p/[agentId]/types";
import { parseCommand } from "./command";
import { assertIssueCommentEvent, createOctokit } from "./utils";

// Extend the max duration of the server actions from this page to 5 minutes
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 300;

export async function POST(request: NextRequest) {
	if (process.env.GITHUB_APP_WEBHOOK_SECRET === undefined) {
		throw new Error("GITHUB_APP_WEBHOOK_SECRET is not set");
	}
	const webhooks = new Webhooks({
		secret: process.env.GITHUB_APP_WEBHOOK_SECRET,
	});

	const signature = request.headers.get("X-Hub-Signature-256") ?? "";
	const body = await request.text();
	const verifyOK = await webhooks.verify(body, signature);
	if (!verifyOK) {
		return new Response("Failed to verify webhook", { status: 400 });
	}

	const id = request.headers.get("X-GitHub-Delivery") ?? "";
	const name = request.headers.get("X-GitHub-Event") as WebhookEventName;
	const rawPayload = JSON.parse(body);
	const event = { id, name, payload: rawPayload };
	assertIssueCommentEvent(event);
	const payload = event.payload;

	const command = parseCommand(payload.comment.body);
	if (command === null) {
		return new Response(
			`Command not found. payload: ${JSON.stringify(payload)}`,
			{ status: 400 },
		);
	}
	if (payload.installation === undefined) {
		return new Response(
			`Installation not found. payload: ${JSON.stringify(payload)}`,
			{ status: 400 },
		);
	}
	const octokit = await createOctokit(payload.installation.id);

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
				});

				await octokit.request(
					"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
					{
						owner: payload.repository.owner.login,
						repo: payload.repository.name,
						issue_number: payload.issue.number,
						body: finalExecution.artifacts[finalExecution.artifacts.length - 1]
							.object.content,
					},
				);
			}),
		),
	);

	return new Response("Accepted", { status: 202 });
}
