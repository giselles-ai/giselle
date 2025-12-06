import { isIconName } from "@giselle-internal/ui/utils";
import {
	isTextGenerationNode,
	isVectorStoreNode,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";
import { getDocumentVectorStores } from "@/lib/vector-stores/document/queries";
import { fetchCurrentTeam } from "@/services/teams";
import type { StageApp, TeamId } from "./types";

async function userTeams() {
	const supabaseUser = await getUser();
	const user = await db.query.supabaseUserMappings.findFirst({
		where: (supabaseUserMappings, { eq }) =>
			eq(supabaseUserMappings.supabaseUserId, supabaseUser.id),
	});
	if (user === undefined) {
		throw new Error("User not found");
	}
	const memberships = await db.query.teamMemberships.findMany({
		where: (teamMemberships, { eq }) =>
			eq(teamMemberships.userDbId, user.userDbId),
		with: {
			team: true,
		},
	});

	const teams = memberships.map((teamMembership) => ({
		id: teamMembership.team.id,
		name: teamMembership.team.name,
		avatarUrl: teamMembership.team.avatarUrl,
		role: teamMembership.role,
		hasActiveSubscription: teamMembership.team.activeSubscriptionId != null,
	}));

	return { userDbId: user.userDbId, teams };
}

async function userApps(teamIds: TeamId[], userDbId: number) {
	const teams = await db.query.teams.findMany({
		where: (teams, { inArray }) => inArray(teams.id, teamIds),
		with: {
			apps: {
				with: {
					workspace: {
						columns: {
							id: true,
							name: true,
							creatorDbId: true,
						},
					},
				},
			},
		},
	});
	const teamDbIds = teams.map((team) => team.dbId);

	const documentStoresByTeam = new Map<
		number,
		Awaited<ReturnType<typeof getDocumentVectorStores>>
	>();

	if (teamDbIds.length > 0) {
		await Promise.all(
			teamDbIds.map(async (teamDbId) => {
				const stores = await getDocumentVectorStores(teamDbId);
				documentStoresByTeam.set(teamDbId, stores);
			}),
		);
	}

	// Build a map of workspace creator user info so we can show who owns each app.
	const creatorDbIds = new Set<number>();
	for (const team of teams) {
		for (const app of team.apps) {
			const creatorDbId = app.workspace.creatorDbId;
			if (creatorDbId != null) {
				creatorDbIds.add(creatorDbId);
			}
		}
	}

	const creatorUsers =
		creatorDbIds.size > 0
			? await db.query.users.findMany({
					where: (usersTable, { inArray }) =>
						inArray(usersTable.dbId, Array.from(creatorDbIds)),
				})
			: [];
	const creatorMap = new Map<
		number,
		{ displayName: string | null; avatarUrl: string | null }
	>();
	for (const creator of creatorUsers) {
		creatorMap.set(creator.dbId, {
			displayName: creator.displayName,
			avatarUrl: creator.avatarUrl,
		});
	}

	const result = await Promise.all(
		teams.flatMap((team) =>
			team.apps.map(async (app) => {
				const workspace = await giselle.getWorkspace(
					app.workspace.id as WorkspaceId,
				);
				const appEntryNode = workspace.nodes.find(
					(node) => node.id === app.appEntryNodeId,
				);
				if (appEntryNode === undefined) {
					logger.warn(
						`App entry node<${app.appEntryNodeId}> not found for app<${app.id}>.`,
					);
					return null;
				}
				const giselleApp = await giselle.getApp({
					appId: app.id,
				});
				// Extract vector store / LLM metadata for this app
				const githubRepositories: string[] = [];
				const documentFiles: string[] = [];
				const llmProviders = new Set<string>();

				// Build adjacency list from workspace connections so we can
				// traverse only nodes that are reachable from the app entry node.
				const connectionsByOutputNodeId = new Map<string, string[]>();
				for (const connection of workspace.connections ?? []) {
					const outputNodeId = connection.outputNode.id;
					const inputNodeId = connection.inputNode.id;
					const existing = connectionsByOutputNodeId.get(outputNodeId);
					if (existing === undefined) {
						connectionsByOutputNodeId.set(outputNodeId, [inputNodeId]);
					} else if (!existing.includes(inputNodeId)) {
						existing.push(inputNodeId);
					}
				}

				const reachableNodeIds = new Set<string>();
				const stack = [appEntryNode.id];
				reachableNodeIds.add(appEntryNode.id);

				while (stack.length > 0) {
					const currentNodeId = stack.pop();
					if (currentNodeId === undefined) {
						continue;
					}
					const nextNodeIds =
						connectionsByOutputNodeId.get(currentNodeId) ?? [];
					for (const nextNodeId of nextNodeIds) {
						if (!reachableNodeIds.has(nextNodeId)) {
							reachableNodeIds.add(nextNodeId);
							stack.push(nextNodeId as `nd-${string}`);
						}
					}
				}

				// LLM providers and vector stores: check only nodes that are
				// reachable from the app's entry node to better reflect what
				// this app actually uses.
				for (const node of workspace.nodes) {
					if (!reachableNodeIds.has(node.id)) {
						continue;
					}

					// LLM providers
					if (
						isTextGenerationNode(node) &&
						node.content.llm?.provider &&
						node.content.llm?.id
					) {
						const provider = node.content.llm.provider;
						if (typeof provider === "string") {
							llmProviders.add(provider);
						}
					}
					// GitHub Vector Store
					if (
						isVectorStoreNode(node, "github") &&
						node.content.source.state.status === "configured"
					) {
						const { owner, repo } = node.content.source.state;
						const fullName = `${owner}/${repo}`;
						if (!githubRepositories.includes(fullName)) {
							githubRepositories.push(fullName);
						}
					}

					// Document Vector Store
					if (
						isVectorStoreNode(node, "document") &&
						node.content.source.state.status === "configured"
					) {
						const { documentVectorStoreId } = node.content.source.state;
						const documentStores = documentStoresByTeam.get(team.dbId) || [];
						const store = documentStores.find(
							(s) => s.id === documentVectorStoreId,
						);
						if (store && store.sources.length > 0) {
							for (const source of store.sources) {
								if (!documentFiles.includes(source.fileName)) {
									documentFiles.push(source.fileName);
								}
							}
						}
					}
				}

				return {
					team,
					workspace,
					dbWorkspace: app.workspace,
					giselleApp,
					githubRepositories,
					documentFiles,
					llmProviders: Array.from(llmProviders),
				};
			}),
		),
	).then((result) => result.filter((data) => data !== null));

	const apps: StageApp[] = [];

	for (const data of result) {
		const creatorDbId = data.dbWorkspace.creatorDbId;
		const creatorInfo =
			creatorDbId != null ? (creatorMap.get(creatorDbId) ?? null) : null;

		apps.push({
			id: data.giselleApp.id,
			name: data.giselleApp.name,
			description: data.giselleApp.description,
			iconName: isIconName(data.giselleApp.iconName)
				? data.giselleApp.iconName
				: "sparkles",
			entryNodeId: data.giselleApp.entryNodeId,
			parameters: data.giselleApp.parameters,
			workspaceId: data.workspace.id,
			workspaceName: data.workspace.name ?? "Untitled workspace",
			teamName: data.team.name,
			teamId: data.team.id,
			isMine: data.dbWorkspace.creatorDbId === userDbId,
			vectorStoreRepositories: data.githubRepositories,
			vectorStoreFiles: data.documentFiles,
			llmProviders: data.llmProviders,
			creator: creatorInfo,
		});
	}

	return apps;
}

async function userTasks(teamIds: TeamId[]) {
	const teams = await db.query.teams.findMany({
		where: (teams, { inArray }) => inArray(teams.id, teamIds),
		with: {
			tasks: {
				columns: {
					id: true,
				},
				where: (tasks, { isNotNull }) => isNotNull(tasks.appDbId),
				orderBy: (tasks, { desc }) => desc(tasks.createdAt),
			},
		},
	});
	const taskIds = teams.flatMap((team) => team.tasks.map((task) => task.id));

	const tasks = await Promise.all(
		taskIds.map((taskId) => giselle.getTask({ taskId })),
	);
	return tasks;
}

export async function dataLoader() {
	const { userDbId, teams } = await userTeams();
	const teamIds = teams.map((team) => team.id);
	const [apps, tasks, currentTeam] = await Promise.all([
		userApps(teamIds, userDbId),
		userTasks(teamIds),
		fetchCurrentTeam(),
	]);

	const currentTeamId = currentTeam?.id ?? teams[0]?.id;

	logger.debug({ teams, apps, tasks, currentTeamId });
	return { teams, apps, tasks, currentTeamId };
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
