import {
	type FlowTrigger,
	type FlowTriggerId,
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

export async function updateTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
	repositoryNodeId: string;
	installationId: number;
	useExperimentalStorage: boolean;
}) {
	const currentTrigger = await getFlowTrigger({
		storage: args.context.storage,
		flowTriggerId: args.flowTriggerId,
	});
	if (currentTrigger === undefined) {
		throw new Error(`Trigger not found: ${args.flowTriggerId}`);
	}
	if (currentTrigger.configuration.provider !== "github") {
		throw new Error("Only GitHub triggers are supported for updates");
	}

	const oldRepositoryNodeId = currentTrigger.configuration.repositoryNodeId;
	const newRepositoryNodeId = args.repositoryNodeId;
	if (oldRepositoryNodeId !== newRepositoryNodeId) {
		await Promise.all([
			removeGitHubRepositoryIntegrationIndex({
				storage: args.context.storage,
				flowTriggerId: args.flowTriggerId,
				repositoryNodeId: oldRepositoryNodeId,
			}),
			addGitHubRepositoryIntegrationIndex({
				storage: args.context.storage,
				flowTriggerId: args.flowTriggerId,
				repositoryNodeId: newRepositoryNodeId,
			}),
		]);
	}
	
	const updatedTrigger = {
		...currentTrigger,
		configuration: {
			provider: "github",
			repositoryNodeId: newRepositoryNodeId,
			installationId: args.installationId,
			event: currentTrigger.configuration.event,
		},
	} satisfies FlowTrigger;
	await setFlowTrigger({
		storage: args.context.storage,
		flowTrigger: updatedTrigger,
	});
	
	const workspace = await getWorkspace({
		storage: args.context.storage,
		experimental_storage: args.context.experimental_storage,
		workspaceId: currentTrigger.workspaceId,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	await setWorkspace({
		storage: args.context.storage,
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
		experimental_storage: args.context.experimental_storage,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	return args.flowTriggerId;
}
