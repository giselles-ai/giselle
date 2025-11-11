import {
	GitHubRepositoryIntegrationIndex,
	type TriggerId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "../storage";

function getGitHubRepositoryIntegrationPath(repositoryNodeId: string): string {
	return `integrations/github/repositories/${repositoryNodeId}.json`;
}

export async function getGitHubRepositoryIntegrationIndex(args: {
	storage: GiselleStorage;
	repositoryNodeId: string;
}) {
	const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
	const exists = await args.storage.exists(path);
	if (!exists) {
		return undefined;
	}
	return await args.storage.getJson({
		path,
		schema: GitHubRepositoryIntegrationIndex,
	});
}

async function setGitHubRepositoryIntegrationIndex(args: {
	storage: GiselleStorage;
	repositoryNodeId: string;
	index: GitHubRepositoryIntegrationIndex;
}) {
	const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
	await args.storage.setJson({
		path,
		data: args.index,
		schema: GitHubRepositoryIntegrationIndex,
	});
	return;
}

export async function addGitHubRepositoryIntegrationIndex(args: {
	storage: GiselleStorage;
	triggerId: TriggerId;
	repositoryNodeId: string;
}) {
	const githubRepositoryIntegrationIndex =
		await getGitHubRepositoryIntegrationIndex({
			repositoryNodeId: args.repositoryNodeId,
			storage: args.storage,
		});

	const currentTriggerIds =
		githubRepositoryIntegrationIndex?.flowTriggerIds ?? [];
	await setGitHubRepositoryIntegrationIndex({
		repositoryNodeId: args.repositoryNodeId,
		storage: args.storage,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: [...currentTriggerIds, args.triggerId],
		},
	});
}

export async function removeGitHubRepositoryIntegrationIndex(args: {
	storage: GiselleStorage;
	triggerId: TriggerId;
	repositoryNodeId: string;
}) {
	const githubRepositoryIntegrationIndex =
		await getGitHubRepositoryIntegrationIndex({
			repositoryNodeId: args.repositoryNodeId,
			storage: args.storage,
		});
	if (githubRepositoryIntegrationIndex === undefined) {
		return;
	}
	const remainingTriggerIds =
		githubRepositoryIntegrationIndex.flowTriggerIds.filter(
			(id) => id !== args.triggerId,
		);
	if (remainingTriggerIds.length === 0) {
		const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
		await args.storage.remove(path);
		return;
	}
	await setGitHubRepositoryIntegrationIndex({
		repositoryNodeId: args.repositoryNodeId,
		storage: args.storage,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: remainingTriggerIds,
		},
	});
}
