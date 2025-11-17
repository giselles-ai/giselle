import { Toasts } from "@giselles-ai/components/toasts";
import { ToastProvider } from "@giselles-ai/contexts/toast";
import type { WorkspaceId } from "@giselles-ai/protocol";
import {
	isActionNode,
	isTriggerNode,
	isVectorStoreNode,
} from "@giselles-ai/protocol";
import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { Suspense, use } from "react";
import { giselle } from "@/app/giselle";
import { acts, agents, db, type agents as dbAgents, users } from "@/db";
import { getDocumentVectorStores } from "@/lib/vector-stores/document/queries";
import { fetchCurrentTeam } from "@/services/teams";
import { SearchableAgentList } from "./components/searchable-agent-list";

function AgentList({
	agents: agentsPromise,
}: {
	agents: Promise<
		Array<
			typeof dbAgents.$inferSelect & {
				executionCount: number;
				creator: {
					displayName: string | null;
					avatarUrl: string | null;
				} | null;
				githubRepositories: string[];
				documentVectorStoreFiles: string[];
			}
		>
	>;
}) {
	const agents = use(agentsPromise);
	if (agents.length === 0) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="grid gap-[8px] justify-center text-center">
					<h3 className="text-[18px] font-geist font-bold text-text/60">
						No workspaces yet.
					</h3>
					<p className="text-[12px] font-geist text-text/60">
						Please create a new workspace with the 'New Workspace +' button.
					</p>
				</div>
			</div>
		);
	}
	return <SearchableAgentList agents={agents} />;
}

async function agentsQuery(teamDbId: number) {
	const agentsList = await db
		.select({
			id: agents.id,
			dbId: agents.dbId,
			teamDbId: agents.teamDbId,
			name: agents.name,
			workspaceId: agents.workspaceId,
			createdAt: agents.createdAt,
			updatedAt: agents.updatedAt,
			creatorDbId: agents.creatorDbId,
			creatorDisplayName: users.displayName,
			creatorAvatarUrl: users.avatarUrl,
		})
		.from(agents)
		.leftJoin(users, eq(agents.creatorDbId, users.dbId))
		.where(and(eq(agents.teamDbId, teamDbId), isNotNull(agents.workspaceId)))
		.orderBy(desc(agents.updatedAt));

	// Get execution counts for each workspace
	const workspaceIds = agentsList
		.map((agent) => agent.workspaceId)
		.filter((id): id is string => id !== null);

	const executionCounts =
		workspaceIds.length > 0
			? await db
					.select({
						workspaceId: acts.sdkWorkspaceId,
						count: count(acts.dbId),
					})
					.from(acts)
					.where(inArray(acts.sdkWorkspaceId, workspaceIds))
					.groupBy(acts.sdkWorkspaceId)
			: [];

	const executionCountMap = new Map(
		executionCounts.map((ec) => [ec.workspaceId, ec.count]),
	);

	// Extract GitHub repositories and Document Vector Store file names from workspace nodes
	const githubRepositoriesMap = new Map<string, string[]>();
	const documentVectorStoreFilesMap = new Map<string, string[]>();

	// Get document vector stores for all teams
	const teamDbIds = [...new Set(agentsList.map((agent) => agent.teamDbId))];
	const documentStoresByTeam = new Map<
		number,
		Awaited<ReturnType<typeof getDocumentVectorStores>>
	>();
	await Promise.all(
		teamDbIds.map(async (teamDbId) => {
			const stores = await getDocumentVectorStores(teamDbId);
			documentStoresByTeam.set(teamDbId, stores);
		}),
	);

	await Promise.all(
		agentsList.map(async (agent) => {
			if (!agent.workspaceId) return;

			try {
				const workspace = await giselle.getWorkspace(
					agent.workspaceId as WorkspaceId,
				);
				const repositories: string[] = [];
				const documentFiles: string[] = [];

				if (workspace.nodes) {
					for (const node of workspace.nodes) {
						// GitHub Vector Store
						if (
							isVectorStoreNode(node, "github") &&
							node.content.source.state.status === "configured"
						) {
							const { owner, repo } = node.content.source.state;
							const fullName = `${owner}/${repo}`;
							if (!repositories.includes(fullName)) {
								repositories.push(fullName);
							}
						}

						// GitHub Trigger
						if (
							isTriggerNode(node, "github") &&
							node.content.state.status === "configured"
						) {
							try {
								const trigger = await giselle.getTrigger({
									triggerId: node.content.state.flowTriggerId,
								});
								if (trigger && trigger.configuration.provider === "github") {
									const repoFullname =
										await giselle.getGitHubRepositoryFullname({
											repositoryNodeId: trigger.configuration.repositoryNodeId,
											installationId: trigger.configuration.installationId,
										});
									const fullName = `${repoFullname.owner}/${repoFullname.repo}`;
									if (!repositories.includes(fullName)) {
										repositories.push(fullName);
									}
								}
							} catch (error) {
								console.error(
									`Error getting trigger repository for workspace ${agent.workspaceId}:`,
									error,
								);
							}
						}

						// GitHub Action
						if (
							isActionNode(node, "github") &&
							node.content.command.state.status === "configured"
						) {
							try {
								const repoFullname = await giselle.getGitHubRepositoryFullname({
									repositoryNodeId: node.content.command.state.repositoryNodeId,
									installationId: node.content.command.state.installationId,
								});
								const fullName = `${repoFullname.owner}/${repoFullname.repo}`;
								if (!repositories.includes(fullName)) {
									repositories.push(fullName);
								}
							} catch (error) {
								console.error(
									`Error getting action repository for workspace ${agent.workspaceId}:`,
									error,
								);
							}
						}

						// Document Vector Store
						if (
							isVectorStoreNode(node, "document") &&
							node.content.source.state.status === "configured"
						) {
							const { documentVectorStoreId } = node.content.source.state;
							const documentStores =
								documentStoresByTeam.get(agent.teamDbId) || [];
							console.log(
								`[DEBUG] Workspace ${agent.workspaceId}: Found document vector store node with ID: ${documentVectorStoreId}`,
							);
							console.log(
								`[DEBUG] Available document stores for team ${agent.teamDbId}:`,
								documentStores.map((s) => s.id),
							);
							const store = documentStores.find(
								(s) => s.id === documentVectorStoreId,
							);
							if (store) {
								console.log(
									`[DEBUG] Found store: ${store.id}, sources count: ${store.sources.length}`,
								);
								if (store.sources.length > 0) {
									for (const source of store.sources) {
										console.log(`[DEBUG] Adding file: ${source.fileName}`);
										if (!documentFiles.includes(source.fileName)) {
											documentFiles.push(source.fileName);
										}
									}
								}
							} else {
								console.log(
									`[DEBUG] Store not found for documentVectorStoreId: ${documentVectorStoreId}`,
								);
							}
						}
					}
				}

				if (repositories.length > 0) {
					githubRepositoriesMap.set(agent.workspaceId, repositories);
				}
				if (documentFiles.length > 0) {
					console.log(
						`[DEBUG] Workspace ${agent.workspaceId}: Setting document files:`,
						documentFiles,
					);
					documentVectorStoreFilesMap.set(agent.workspaceId, documentFiles);
				}
			} catch (error) {
				console.error(
					`Error extracting vector store info for workspace ${agent.workspaceId}:`,
					error,
				);
			}
		}),
	);

	return agentsList.map((agent) => ({
		...agent,
		executionCount: executionCountMap.get(agent.workspaceId || "") || 0,
		creator:
			agent.creatorDisplayName || agent.creatorAvatarUrl
				? {
						displayName: agent.creatorDisplayName,
						avatarUrl: agent.creatorAvatarUrl,
					}
				: null,
		githubRepositories:
			githubRepositoriesMap.get(agent.workspaceId || "") || [],
		documentVectorStoreFiles:
			documentVectorStoreFilesMap.get(agent.workspaceId || "") || [],
	}));
}

export default async function AgentListV2Page() {
	const currentTeam = await fetchCurrentTeam();
	const agents = agentsQuery(currentTeam.dbId);
	return (
		<ToastProvider>
			<div className="w-full pt-2 pb-2">
				<Suspense fallback={<p className="text-center py-8">Loading...</p>}>
					<AgentList agents={agents} />
				</Suspense>
				<Toasts />
			</div>
		</ToastProvider>
	);
}
