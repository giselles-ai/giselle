import { getTeamMembershipByAgentId } from "@/app/(auth)/lib/get-team-membership-by-agent-id";
import { agents, db, githubIntegrationSettings } from "@/drizzle";
import { developerFlag } from "@/flags";
import {
	ExternalServiceName,
	VercelBlobOperation,
	createLogger,
	waitForTelemetryExport,
	withCountMeasurement,
} from "@/lib/opentelemetry";
import { getUser } from "@/lib/supabase";
import { AgentIdProvider } from "@/packages/contexts/agent-id";
import { connectIdentity, reconnectIdentity } from "@/services/accounts";
import { saveAgentActivity } from "@/services/agents/activities";
import { gitHubAppInstallURL } from "@/services/external/github";
import type {
	GitHubNextAction,
	GitHubTriggerEvent,
} from "@/services/external/github/types";
import { reportAgentTimeUsage } from "@/services/usage-based-billing";
import { putGraph } from "@giselles-ai/actions";
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
import {
	executeNode,
	executeStep,
	retryStep,
	wrapAgentExecutionServerAction,
} from "@giselles-ai/lib/execution";
import {
	type CreateGitHubIntegrationSettingResult,
	getGitHubIntegrationState,
} from "@giselles-ai/lib/github";
import { isLatestVersion, migrateGraph } from "@giselles-ai/lib/graph";
import {
	buildGraphExecutionPath,
	buildGraphFolderPath,
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
import { del, list, put } from "@vercel/blob";
import { ReactFlowProvider } from "@xyflow/react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

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

	const gitHubIntegrationState = await getGitHubIntegrationState(agent.dbId);

	async function persistGraph(graph: Graph) {
		"use server";
		const startTime = Date.now();
		const logger = createLogger("persistGraph");
		const { url } = await putGraph(graph);
		const { blobList } = await withCountMeasurement(
			logger,
			async () => {
				const result = await list({
					prefix: buildGraphFolderPath(graph.id),
					mode: "folded",
				});
				const size = result.blobs.reduce((sum, blob) => sum + blob.size, 0);
				return {
					blobList: result,
					size,
				};
			},
			ExternalServiceName.VercelBlob,
			startTime,
			VercelBlobOperation.List,
		);

		const oldBlobs = blobList.blobs
			.filter((blob) => blob.url !== url)
			.map((blob) => ({
				url: blob.url,
				size: blob.size,
			}));

		if (oldBlobs.length > 0) {
			await withCountMeasurement(
				logger,
				async () => {
					await del(oldBlobs.map((blob) => blob.url));
					const totalSize = oldBlobs.reduce((sum, blob) => sum + blob.size, 0);
					return {
						size: totalSize,
					};
				},
				ExternalServiceName.VercelBlob,
				startTime,
				VercelBlobOperation.Del,
			);
			waitForTelemetryExport();
		}

		await db
			.update(agents)
			.set({
				graphUrl: url,
			})
			.where(eq(agents.id, agentId));

		return url;
	}

	let graphUrl = agent.graphUrl;
	if (!isLatestVersion(graph)) {
		graph = migrateGraph(graph);
		graphUrl = await persistGraph(graph);
	}

	async function updateAgentName(agentName: string | null) {
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
		return await wrapAgentExecutionServerAction(async () =>
			executeStep({
				agentId,
				flowId,
				executionId,
				stepId,
				artifacts,
				stream: true,
			}),
		);
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
		return await wrapAgentExecutionServerAction(async () =>
			retryStep({
				agentId,
				retryExecutionSnapshotUrl,
				executionId,
				stepId,
				artifacts,
				stream: true,
			}),
		);
	}

	async function executeNodeAction(executionId: ExecutionId, nodeId: NodeId) {
		"use server";
		return await wrapAgentExecutionServerAction(async () =>
			executeNode({ agentId, executionId, nodeId, stream: true }),
		);
	}

	async function onFinishPerformExecutionAction(
		startedAt: number,
		endedAt: number,
		totalDurationMs: number,
	) {
		"use server";

		const startedAtDate = new Date(startedAt);
		const endedAtDate = new Date(endedAt);
		await saveAgentActivity(
			agentId,
			startedAtDate,
			endedAtDate,
			totalDurationMs,
		);
		await reportAgentTimeUsage(agentId, endedAtDate);
	}

	async function connectGitHubIdentityAction() {
		"use server";
		return connectIdentity("github", `/p/${agentId}`);
	}

	async function reconnectGitHubIdentityAction() {
		"use server";
		return reconnectIdentity("github", `/p/${agentId}`);
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
				onPersistAction={persistGraph}
				defaultGraphUrl={graphUrl}
			>
				<GitHubIntegrationProvider
					{...gitHubIntegrationState}
					installUrl={await gitHubAppInstallURL()}
					upsertGitHubIntegrationSettingAction={
						upsertGitHubIntegrationSettingAction
					}
					connectGitHubIdentityAction={connectGitHubIdentityAction}
					reconnectGitHubIdentityAction={reconnectGitHubIdentityAction}
				>
					<PropertiesPanelProvider>
						<ReactFlowProvider>
							<ToolbarContextProvider>
								<MousePositionProvider>
									<ToastProvider>
										<AgentIdProvider value={agentId}>
											<AgentNameProvider
												defaultValue={agent.name}
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
										</AgentIdProvider>
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
