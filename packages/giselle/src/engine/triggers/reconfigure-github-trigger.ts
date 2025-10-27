import {
	type FlowTrigger,
	type FlowTriggerId,
	type GitHubFlowTriggerEvent,
	isTriggerNode,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import {
	addGitHubRepositoryIntegrationIndex,
	removeGitHubRepositoryIntegrationIndex,
} from "../integrations/utils";
import type { GiselleEngineContext } from "../types";
import { getWorkspace, setWorkspace } from "../workspaces/utils";
import { getFlowTrigger, setFlowTrigger } from "./utils";

export async function reconfigureGitHubTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
	repositoryNodeId: string;
	installationId: number;
	useExperimentalStorage: boolean;
	event?: GitHubFlowTriggerEvent;
}) {
	const currentTrigger = await getFlowTrigger({
		deprecated_storage: args.context.deprecated_storage,
		storage: args.context.storage,
		flowTriggerId: args.flowTriggerId,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	if (currentTrigger === undefined) {
		throw new Error(`Trigger not found: ${args.flowTriggerId}`);
	}
	if (currentTrigger.configuration.provider !== "github") {
		throw new Error("Only GitHub triggers are supported for updates");
	}

	const currentEvent = currentTrigger.configuration.event;
	const requestedEvent = args.event ?? currentEvent;
	if (requestedEvent.id !== currentEvent.id) {
		throw new Error(
			`Changing GitHub trigger event type is not supported (${currentEvent.id} → ${requestedEvent.id})`,
		);
	}

	const oldRepositoryNodeId = currentTrigger.configuration.repositoryNodeId;
	const newRepositoryNodeId = args.repositoryNodeId;
	if (oldRepositoryNodeId !== newRepositoryNodeId) {
		await Promise.all([
			removeGitHubRepositoryIntegrationIndex({
				deprecated_storage: args.context.deprecated_storage,
				storage: args.context.storage,
				flowTriggerId: args.flowTriggerId,
				repositoryNodeId: oldRepositoryNodeId,
				useExperimentalStorage: args.useExperimentalStorage,
			}),
			addGitHubRepositoryIntegrationIndex({
				deprecated_storage: args.context.deprecated_storage,
				storage: args.context.storage,
				flowTriggerId: args.flowTriggerId,
				repositoryNodeId: newRepositoryNodeId,
				useExperimentalStorage: args.useExperimentalStorage,
			}),
		]);
	}

	const updatedTrigger = {
		...currentTrigger,
		configuration: {
			provider: "github",
			repositoryNodeId: newRepositoryNodeId,
			installationId: args.installationId,
			event: requestedEvent,
		},
	} satisfies FlowTrigger;
	await setFlowTrigger({
		deprecated_storage: args.context.deprecated_storage,
		storage: args.context.storage,
		flowTrigger: updatedTrigger,
		useExperimentalStorage: args.useExperimentalStorage,
	});

	const workspace = await getWorkspace({
		deprecated_storage: args.context.deprecated_storage,
		storage: args.context.storage,
		workspaceId: currentTrigger.workspaceId,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	await setWorkspace({
		deprecated_storage: args.context.deprecated_storage,
		workspaceId: workspace.id,
		workspace: {
			...workspace,
			nodes: workspace.nodes.map((node) =>
				node.id === currentTrigger.nodeId && isTriggerNode(node)
					? ({
							...node,
							content: {
								...node.content,
								state: {
									status: "configured",
									flowTriggerId: args.flowTriggerId,
								},
							},
						} satisfies TriggerNode)
					: node,
			),
		},
		storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	return args.flowTriggerId;
}
