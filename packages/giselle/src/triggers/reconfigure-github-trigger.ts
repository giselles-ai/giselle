import {
	type GitHubEventData,
	isTriggerNode,
	type Trigger,
	type TriggerId,
	type TriggerNode,
} from "@giselles-ai/protocol";
import {
	addGitHubRepositoryIntegrationIndex,
	removeGitHubRepositoryIntegrationIndex,
} from "../integrations/utils";
import type { GiselleContext } from "../types";
import { getWorkspace, setWorkspace } from "../workspaces/utils";
import { getTrigger, setTrigger } from "./utils";

export async function reconfigureGitHubTrigger(args: {
	context: GiselleContext;
	triggerId: TriggerId;
	repositoryNodeId: string;
	installationId: number;
	event?: GitHubEventData;
}) {
	const currentTrigger = await getTrigger({
		storage: args.context.storage,
		triggerId: args.triggerId,
	});
	if (currentTrigger === undefined) {
		throw new Error(`Trigger not found: ${args.triggerId}`);
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
				storage: args.context.storage,
				triggerId: args.triggerId,
				repositoryNodeId: oldRepositoryNodeId,
			}),
			addGitHubRepositoryIntegrationIndex({
				storage: args.context.storage,
				triggerId: args.triggerId,
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
			event: requestedEvent,
		},
	} satisfies Trigger;
	await setTrigger({
		storage: args.context.storage,
		trigger: updatedTrigger,
	});

	const workspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: currentTrigger.workspaceId,
	});
	await setWorkspace({
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
									flowTriggerId: args.triggerId,
								},
							},
						} satisfies TriggerNode)
					: node,
			),
		},
		storage: args.context.storage,
	});
	return args.triggerId;
}
