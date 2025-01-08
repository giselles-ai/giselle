import { getTeamMembershipByAgentId } from "@/app/(auth)/lib/get-team-membership-by-agent-id";
import { agents, db, githubIntegrationSettings } from "@/drizzle";
import { developerFlag } from "@/flags";
import { toUTCDate } from "@/lib/date";
import {
	ExternalServiceName,
	VercelBlobOperation,
	createLogger,
	waitForTelemetryExport,
	withCountMeasurement,
} from "@/lib/opentelemetry";
import { getUser } from "@/lib/supabase";
import { saveAgentActivity } from "@/services/agents/activities";
import type {
	GitHubNextAction,
	GitHubTriggerEvent,
} from "@/services/external/github/types";
import { reportAgentTimeUsage } from "@/services/usage-based-billing/report-agent-time-usage";
import { Playground } from "@giselles-ai/components/playground";
import { AgentNameProvider } from "@giselles-ai/contexts/agent-name";
import { DeveloperModeProvider } from "@giselles-ai/contexts/developer-mode";
import { ExecutionProvider } from "@giselles-ai/contexts/execution";
import { GitHubIntegrationProvider } from "@giselles-ai/contexts/github-integration";
import { GraphContextProvider } from "@giselles-ai/contexts/graph";
import { MousePositionProvider } from "@giselles-ai/contexts/mouse-position";
import { PlaygroundModeProvider } from "@giselles-ai/contexts/playground-mode";
import { PropertiesPanelProvider } from "@giselles-ai/contexts/properties-panel";
import { ToastProvider } from "@giselles-ai/contexts/toast";
import { ToolbarContextProvider } from "@giselles-ai/contexts/toolbar";
import { persistGraph } from "@giselles-ai/giselle-provider/graph/persist";
import {
	executeNode,
	executeStep,
	retryStep,
} from "@giselles-ai/lib/execution";
import {
	type CreateGitHubIntegrationSettingResult,
	getGitHubIntegrationState,
} from "@giselles-ai/lib/github";
import { isLatestVersion, migrateGraph } from "@giselles-ai/lib/graph";
import {
	buildGraphExecutionPath,
	createGithubIntegrationSettingId,
} from "@giselles-ai/lib/utils";
import type {
	AgentId,
	Artifact,
	ExecutionId,
	ExecutionSnapshot,
	FlowId,
	GitHubEventNodeMapping,
	GitHubIntegrationSettingId,
	Graph,
	NodeId,
	StepId,
} from "@giselles-ai/types";
import { put } from "@vercel/blob";
import { ReactFlowProvider } from "@xyflow/react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// Extend the max duration of the server actions from this page to 5 minutes
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 300;

export default async function Page({
	params,
}: {
	params: Promise<{ agentId: AgentId }>;
}) {
	const [developerMode, { agentId }, user] = await Promise.all([
		developerFlag(),
		params,
		getUser(),
	]);

	const [agent, teamMembership] = await Promise.all([
		db.query.agents.findFirst({
			where: (agents, { eq }) => eq(agents.id, agentId),
		}),
		getTeamMembershipByAgentId(agentId, user.id),
	]);
	// TODO: Remove graphUrl null check when add notNull constrain to graphUrl column
	if (agent === undefined || agent.graphUrl === null || !teamMembership) {
		notFound();
	}
	// TODO: Add schema validation to verify parsed graph matches expected shape
	let graph = await fetch(agent.graphUrl).then(
		(res) => res.json() as unknown as Graph,
	);
	let graphUrl = agent.graphUrl;
	if (!isLatestVersion(graph)) {
		graph = migrateGraph(graph);
		graphUrl = await persistGraph({ graph, agentId });
	}

	const gitHubIntegrationState = await getGitHubIntegrationState(agent.dbId);

	async function persistGraphAction(graph: Graph) {
		"use server";
		return persistGraph({ graph, agentId });
	}

	async function updateAgentName(agentName: string) {
		"use server";
		await db
			.update(agents)
			.set({
				name: agentName,
			})
			.where(eq(agents.id, agentId));
		return agentName;
	}

	async function executeStepAction(
		flowId: FlowId,
		executionId: ExecutionId,
		stepId: StepId,
		artifacts: Artifact[],
	) {
		"use server";
		return await executeStep({
			agentId,
			flowId,
			executionId,
			stepId,
			artifacts,
			stream: true,
			userId: user.id,
		});
	}
	async function putExecutionAction(executionSnapshot: ExecutionSnapshot) {
		"use server";
		const startTime = Date.now();
		const result = await withCountMeasurement(
			createLogger("putExecutionAction"),
			async () => {
				const stringifiedExecution = JSON.stringify(executionSnapshot);
				const result = await put(
					buildGraphExecutionPath(graph.id, executionSnapshot.execution.id),
					stringifiedExecution,
					{
						access: "public",
					},
				);
				return {
					url: result.url,
					size: new TextEncoder().encode(stringifiedExecution).length,
				};
			},
			ExternalServiceName.VercelBlob,
			startTime,
			VercelBlobOperation.Put,
		);
		waitForTelemetryExport();
		return { blobUrl: result.url };
	}

	async function retryStepAction(
		retryExecutionSnapshotUrl: string,
		executionId: ExecutionId,
		stepId: StepId,
		artifacts: Artifact[],
	) {
		"use server";
		return await retryStep({
			agentId,
			retryExecutionSnapshotUrl,
			executionId,
			stepId,
			artifacts,
			stream: true,
			userId: user.id,
		});
	}

	async function executeNodeAction(executionId: ExecutionId, nodeId: NodeId) {
		"use server";
		return await executeNode({
			agentId,
			executionId,
			nodeId,
			stream: true,
			userId: user.id,
		});
	}

	async function onFinishPerformExecutionAction(
		startedAt: number,
		endedAt: number,
		totalDurationMs: number,
	) {
		"use server";

		const startedAtDateUTC = toUTCDate(new Date(startedAt));
		const endedAtDateUTC = toUTCDate(new Date(endedAt));
		await saveAgentActivity(
			agentId,
			startedAtDateUTC,
			endedAtDateUTC,
			totalDurationMs,
		);
		await reportAgentTimeUsage(endedAtDateUTC);
	}

	async function upsertGitHubIntegrationSettingAction(
		_: unknown,
		formData: FormData,
	): Promise<CreateGitHubIntegrationSettingResult> {
		"use server";

		if (agent === undefined) {
			throw new Error("Agent not found");
		}
		const repositoryFullName = formData.get("repositoryFullName");
		const event = formData.get("event") as GitHubTriggerEvent;
		const callSign = formData.get("callSign");
		const flowId = formData.get("flowId") as FlowId;
		const githubEventNodeMappings = formData.get("githubEventNodeMappings");
		const nextAction = formData.get("nextAction") as GitHubNextAction;
		const inputId = formData.get("id") as GitHubIntegrationSettingId;
		if (
			typeof repositoryFullName !== "string" ||
			repositoryFullName.length === 0
		) {
			return {
				result: "error",
				message: "Please choose a repository",
			};
		}
		if (typeof event !== "string" || event.length === 0) {
			return {
				result: "error",
				message: "Please choose an event",
			};
		}
		if (typeof callSign !== "string" || callSign.length === 0) {
			return {
				result: "error",
				message: "Please enter a call sign",
			};
		}
		if (typeof flowId !== "string" || flowId.length === 0) {
			return {
				result: "error",
				message: "Please select a flow",
			};
		}
		if (typeof githubEventNodeMappings !== "string") {
			return {
				result: "error",
				message: "Please configure event mappings",
			};
		}
		const parsedEventNodeMappings = JSON.parse(
			githubEventNodeMappings,
		) as GitHubEventNodeMapping[];
		if (
			!Array.isArray(parsedEventNodeMappings) ||
			parsedEventNodeMappings.length === 0
		) {
			return {
				result: "error",
				message: "Invalid event mappings",
			};
		}
		if (typeof nextAction !== "string" || nextAction.length === 0) {
			return {
				result: "error",
				message: "Please select a next action",
			};
		}

		const id = inputId ?? createGithubIntegrationSettingId();

		const setting = {
			repositoryFullName,
			event,
			callSign,
			flowId,
			eventNodeMappings: parsedEventNodeMappings,
			nextAction,
		};
		await db
			.insert(githubIntegrationSettings)
			.values({
				agentDbId: agent.dbId,
				id,
				...setting,
			})
			.onConflictDoUpdate({
				target: githubIntegrationSettings.id,
				set: setting,
			});
		return {
			result: "success",
			setting: {
				id,
				...setting,
			},
		};
	}

	return (
		<DeveloperModeProvider developerMode={developerMode}>
			<GraphContextProvider
				defaultGraph={graph}
				onPersistAction={persistGraphAction}
				defaultGraphUrl={graphUrl}
			>
				<GitHubIntegrationProvider
					{...gitHubIntegrationState}
					upsertGitHubIntegrationSettingAction={
						upsertGitHubIntegrationSettingAction
					}
				>
					<PropertiesPanelProvider>
						<ReactFlowProvider>
							<ToolbarContextProvider>
								<MousePositionProvider>
									<ToastProvider>
										<AgentNameProvider
											defaultValue={agent.name ?? "Unnamed Agent"}
											updateAgentNameAction={updateAgentName}
										>
											<PlaygroundModeProvider>
												<ExecutionProvider
													executeStepAction={executeStepAction}
													putExecutionAction={putExecutionAction}
													retryStepAction={retryStepAction}
													executeNodeAction={executeNodeAction}
													onFinishPerformExecutionAction={
														onFinishPerformExecutionAction
													}
												>
													<Playground />
												</ExecutionProvider>
											</PlaygroundModeProvider>
										</AgentNameProvider>
									</ToastProvider>
								</MousePositionProvider>
							</ToolbarContextProvider>
						</ReactFlowProvider>
					</PropertiesPanelProvider>
				</GitHubIntegrationProvider>
			</GraphContextProvider>
		</DeveloperModeProvider>
	);
}
