import { isIconName } from "@giselle-internal/ui/utils";
import { isTextGenerationNode, isVectorStoreNode } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { apps as appsDefinition, db } from "@/db";
import { getCurrentUser } from "@/lib/get-current-user";
import { logger } from "@/lib/logger";
import { getDocumentVectorStores } from "@/lib/vector-stores/document/queries";
import { fetchCurrentTeam } from "@/services/teams";
import type { StageApp } from "./types";

async function getApps(teamDbId: number, userDbId: number) {
	const dbWorkspaces = await db.query.workspaces.findMany({
		where: (workspaces, { eq, and, exists }) =>
			and(
				eq(workspaces.teamDbId, teamDbId),
				eq(workspaces.metadata, { sample: false }),
				exists(
					db
						.select({ workspaceDbId: appsDefinition.workspaceDbId })
						.from(appsDefinition)
						.where(eq(appsDefinition.workspaceDbId, workspaces.dbId)),
				),
			),
		with: {
			app: {
				columns: {
					id: true,
					appEntryNodeId: true,
				},
			},
		},
	});

	const documentStoresByTeam = new Map<
		number,
		Awaited<ReturnType<typeof getDocumentVectorStores>>
	>();

	const stores = await getDocumentVectorStores(teamDbId);
	documentStoresByTeam.set(teamDbId, stores);

	// Build a map of workspace creator user info so we can show who owns each app.
	const creatorDbIds = new Set<number>();
	for (const workspaceWithApp of dbWorkspaces) {
		const creatorDbId = workspaceWithApp.creatorDbId;
		if (creatorDbId != null) {
			creatorDbIds.add(creatorDbId);
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
		dbWorkspaces.map(async (dbWorkspace) => {
			const giselleWorkspace = await giselle.getWorkspace(dbWorkspace.id);
			const appEntryNode = giselleWorkspace.nodes.find(
				(node) => node.id === dbWorkspace.app.appEntryNodeId,
			);
			if (appEntryNode === undefined) {
				logger.warn(
					`App entry node<${dbWorkspace.app.appEntryNodeId}> not found for app<${dbWorkspace.app.id}>.`,
				);
				return null;
			}
			const giselleApp = await giselle.getApp({
				appId: dbWorkspace.app.id,
			});
			// Extract vector store / LLM metadata for this app
			const githubRepositories: string[] = [];
			const documentFiles: string[] = [];
			const llmProviders = new Set<string>();

			// Build adjacency list from workspace connections so we can
			// traverse only nodes that are reachable from the app entry node.
			const connectionsByOutputNodeId = new Map<string, string[]>();
			for (const connection of giselleWorkspace.connections ?? []) {
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
				const nextNodeIds = connectionsByOutputNodeId.get(currentNodeId) ?? [];
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
			for (const node of giselleWorkspace.nodes) {
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
					const documentStores = documentStoresByTeam.get(teamDbId) || [];
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
				workspace: giselleWorkspace,
				dbWorkspace: dbWorkspace,
				giselleApp,
				githubRepositories,
				documentFiles,
				llmProviders: Array.from(llmProviders),
			};
		}),
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
			isMine: data.dbWorkspace.creatorDbId === userDbId,
			vectorStoreRepositories: data.githubRepositories,
			vectorStoreFiles: data.documentFiles,
			llmProviders: data.llmProviders,
			creator: creatorInfo,
		});
	}

	return apps;
}

async function getSampleApps(teamDbId: number, userDbId: number) {
	const dbWorkspaces = await db.query.workspaces.findMany({
		where: (workspaces, { eq, and, exists }) =>
			and(
				eq(workspaces.teamDbId, teamDbId),
				eq(workspaces.metadata, { sample: true }),
				exists(
					db
						.select({ workspaceDbId: appsDefinition.workspaceDbId })
						.from(appsDefinition)
						.where(eq(appsDefinition.workspaceDbId, workspaces.dbId)),
				),
			),
		with: {
			app: {
				columns: {
					id: true,
					appEntryNodeId: true,
				},
			},
		},
	});

	const documentStoresByTeam = new Map<
		number,
		Awaited<ReturnType<typeof getDocumentVectorStores>>
	>();

	const stores = await getDocumentVectorStores(teamDbId);
	documentStoresByTeam.set(teamDbId, stores);

	// Build a map of workspace creator user info so we can show who owns each app.
	const creatorDbIds = new Set<number>();
	for (const workspaceWithApp of dbWorkspaces) {
		const creatorDbId = workspaceWithApp.creatorDbId;
		if (creatorDbId != null) {
			creatorDbIds.add(creatorDbId);
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
		dbWorkspaces.map(async (dbWorkspace) => {
			const giselleWorkspace = await giselle.getWorkspace(dbWorkspace.id);
			const appEntryNode = giselleWorkspace.nodes.find(
				(node) => node.id === dbWorkspace.app.appEntryNodeId,
			);
			if (appEntryNode === undefined) {
				logger.warn(
					`App entry node<${dbWorkspace.app.appEntryNodeId}> not found for app<${dbWorkspace.app.id}>.`,
				);
				return null;
			}
			const giselleApp = await giselle.getApp({
				appId: dbWorkspace.app.id,
			});
			// Extract vector store / LLM metadata for this app
			const githubRepositories: string[] = [];
			const documentFiles: string[] = [];
			const llmProviders = new Set<string>();

			// Build adjacency list from workspace connections so we can
			// traverse only nodes that are reachable from the app entry node.
			const connectionsByOutputNodeId = new Map<string, string[]>();
			for (const connection of giselleWorkspace.connections ?? []) {
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
				const nextNodeIds = connectionsByOutputNodeId.get(currentNodeId) ?? [];
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
			for (const node of giselleWorkspace.nodes) {
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
					const documentStores = documentStoresByTeam.get(teamDbId) || [];
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
				workspace: giselleWorkspace,
				dbWorkspace: dbWorkspace,
				giselleApp,
				githubRepositories,
				documentFiles,
				llmProviders: Array.from(llmProviders),
			};
		}),
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
			isMine: data.dbWorkspace.creatorDbId === userDbId,
			vectorStoreRepositories: data.githubRepositories,
			vectorStoreFiles: data.documentFiles,
			llmProviders: data.llmProviders,
			creator: creatorInfo,
		});
	}

	return apps;
}

async function getTasks(teamDbId: number) {
	const dbTasks = await db.query.tasks.findMany({
		columns: { id: true },
		where: (tasks, { eq, and, isNotNull }) =>
			and(eq(tasks.teamDbId, teamDbId), isNotNull(tasks.appDbId)),
		orderBy: (tasks, { desc }) => desc(tasks.createdAt),
	});
	const tasks = await Promise.all(
		dbTasks.map((dbTask) => giselle.getTask({ taskId: dbTask.id })),
	);
	return tasks;
}

export async function dataLoader() {
	const [currentUser, currentTeam] = await Promise.all([
		getCurrentUser(),
		fetchCurrentTeam(),
	]);
	const [apps, _sampleApps, tasks] = await Promise.all([
		getApps(currentTeam.dbId, currentUser.dbId),
		getSampleApps(currentTeam.dbId, currentUser.dbId),
		getTasks(currentTeam.dbId),
	]);

	const currentTeamId = currentTeam.id;

	logger.debug({ apps, tasks, currentTeamId });
	return { apps, tasks, currentTeamId };
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
