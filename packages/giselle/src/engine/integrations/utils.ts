import {
	type FlowTriggerId,
	GitHubRepositoryIntegrationIndex,
} from "@giselle-sdk/data-type";
import type { GiselleStorage } from "../experimental_storage";

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
	flowTriggerId: FlowTriggerId;
	repositoryNodeId: string;
}) {
	const githubRepositoryIntegrationIndex =
		await getGitHubRepositoryIntegrationIndex({
			repositoryNodeId: args.repositoryNodeId,
			storage: args.storage,
		});

	const currentFlowTriggerIds =
		githubRepositoryIntegrationIndex?.flowTriggerIds ?? [];
	await setGitHubRepositoryIntegrationIndex({
		repositoryNodeId: args.repositoryNodeId,
		storage: args.storage,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: [...currentFlowTriggerIds, args.flowTriggerId],
		},
	});
}

export async function removeGitHubRepositoryIntegrationIndex(args: {
	storage: GiselleStorage;
	flowTriggerId: FlowTriggerId;
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
	const remainingFlowTriggerIds =
		githubRepositoryIntegrationIndex.flowTriggerIds.filter(
			(id) => id !== args.flowTriggerId,
		);
	if (remainingFlowTriggerIds.length === 0) {
		const path = getGitHubRepositoryIntegrationPath(args.repositoryNodeId);
		await args.storage.remove(path);
		return;
	}
	await setGitHubRepositoryIntegrationIndex({
		repositoryNodeId: args.repositoryNodeId,
		storage: args.storage,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: remainingFlowTriggerIds,
		},
	});
}
