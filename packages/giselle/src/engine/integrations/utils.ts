import {
	type FlowTriggerId,
	GitHubRepositoryIntegrationIndex,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";

function getGitHubRepositoryIntegrationPath(repositoryNodeId: string): string {
	return `integrations/github/repositories/${repositoryNodeId}.json`;
}

export async function getGitHubRepositoryIntegrationIndex(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	repositoryNodeId: string;
	useExperimentalStorage?: boolean;
}) {
	const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
	if (args.useExperimentalStorage) {
		const exists = await args.storage.exists(path);
		if (!exists) {
			return undefined;
		}
		return await args.storage.getJson({
			path,
			schema: GitHubRepositoryIntegrationIndex,
		});
	}
	const unsafe = await args.deprecated_storage.get(path);
	if (unsafe === null) {
		return undefined;
	}
	return GitHubRepositoryIntegrationIndex.parse(unsafe);
}

async function setGitHubRepositoryIntegrationIndex(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	repositoryNodeId: string;
	index: GitHubRepositoryIntegrationIndex;
	useExperimentalStorage?: boolean;
}) {
	const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
	if (args.useExperimentalStorage) {
		await args.storage.setJson({
			path,
			data: args.index,
			schema: GitHubRepositoryIntegrationIndex,
		});
		return;
	}
	await args.deprecated_storage.set(path, args.index);
}

export async function addGitHubRepositoryIntegrationIndex(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	flowTriggerId: FlowTriggerId;
	repositoryNodeId: string;
	useExperimentalStorage?: boolean;
}) {
	const githubRepositoryIntegrationIndex =
		await getGitHubRepositoryIntegrationIndex({
			deprecated_storage: args.deprecated_storage,
			repositoryNodeId: args.repositoryNodeId,
			storage: args.storage,
			useExperimentalStorage: args.useExperimentalStorage,
		});

	const currentFlowTriggerIds =
		githubRepositoryIntegrationIndex?.flowTriggerIds ?? [];
	await setGitHubRepositoryIntegrationIndex({
		deprecated_storage: args.deprecated_storage,
		repositoryNodeId: args.repositoryNodeId,
		storage: args.storage,
		useExperimentalStorage: args.useExperimentalStorage,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: [...currentFlowTriggerIds, args.flowTriggerId],
		},
	});
}

export async function removeGitHubRepositoryIntegrationIndex(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	flowTriggerId: FlowTriggerId;
	repositoryNodeId: string;
	useExperimentalStorage?: boolean;
}) {
	const githubRepositoryIntegrationIndex =
		await getGitHubRepositoryIntegrationIndex({
			deprecated_storage: args.deprecated_storage,
			repositoryNodeId: args.repositoryNodeId,
			storage: args.storage,
			useExperimentalStorage: args.useExperimentalStorage,
		});
	if (githubRepositoryIntegrationIndex === undefined) {
		return;
	}
	const remainingFlowTriggerIds =
		githubRepositoryIntegrationIndex.flowTriggerIds.filter(
			(id) => id !== args.flowTriggerId,
		);
	if (remainingFlowTriggerIds.length === 0) {
		const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
		if (args.useExperimentalStorage) {
			await args.storage.remove(path);
			return;
		}
		await args.deprecated_storage.removeItem(path);
		return;
	}
	await setGitHubRepositoryIntegrationIndex({
		deprecated_storage: args.deprecated_storage,
		repositoryNodeId: args.repositoryNodeId,
		storage: args.storage,
		useExperimentalStorage: args.useExperimentalStorage,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: remainingFlowTriggerIds,
		},
	});
}
