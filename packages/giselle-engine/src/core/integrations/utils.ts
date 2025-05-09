import {
	type FlowTriggerId,
	GitHubRepositoryIntegrationIndex,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";

export function getGitHubRepositoryIntegrationPath(
	repositoryNodeId: string,
): string {
	return `integrations/github/repositories/${repositoryNodeId}.json`;
}

export async function getGitHubRepositoryIntegrationIndex(args: {
	storage: Storage;
	repositoryNodeId: string;
}) {
	const unsafe = await args.storage.get(
		getGitHubRepositoryIntegrationPath(args.repositoryNodeId),
	);
	if (unsafe === null) {
		return undefined;
	}
	return GitHubRepositoryIntegrationIndex.parse(unsafe);
}

async function setGitHubRepositoryIntegrationIndex(args: {
	storage: Storage;
	repositoryNodeId: string;
	index: GitHubRepositoryIntegrationIndex;
}) {
	await args.storage.set(
		getGitHubRepositoryIntegrationPath(args.repositoryNodeId),
		args.index,
	);
}

export async function addGitHubRepositoryIntegrationIndex(args: {
	storage: Storage;
	flowTriggerId: FlowTriggerId;
	repositoryNodeId: string;
}) {
	const githubRepositoryIntegrationIndex =
		await getGitHubRepositoryIntegrationIndex({
			storage: args.storage,
			repositoryNodeId: args.repositoryNodeId,
		});

	const currentFlowTriggerIds =
		githubRepositoryIntegrationIndex?.flowTriggerIds ?? [];
	await setGitHubRepositoryIntegrationIndex({
		storage: args.storage,
		repositoryNodeId: args.repositoryNodeId,
		index: {
			repositoryNodeId: args.repositoryNodeId,
			flowTriggerIds: [...currentFlowTriggerIds, args.flowTriggerId],
		},
	});
}
