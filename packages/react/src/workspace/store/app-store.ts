import {
	isAppEntryNode,
	isEndNode,
	type NodeId,
	type Workspace,
} from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { AppStore } from "./store";

function hasStartNode(workspace: Workspace | null) {
	if (!workspace) return false;
	return workspace.nodes.some((node) => isAppEntryNode(node));
}

function hasEndNode(workspace: Workspace | null) {
	if (!workspace) return false;
	return workspace.nodes.some((node) => isEndNode(node));
}

function isStartNodeConnectedToEndNode(workspace: Workspace | null) {
	if (!workspace) return false;

	const startNodeIds: NodeId[] = workspace.nodes
		.filter((node) => isAppEntryNode(node))
		.map((node) => node.id);
	if (startNodeIds.length === 0) return false;

	const endNodeIdSet = new Set<NodeId>(
		workspace.nodes.filter((node) => isEndNode(node)).map((node) => node.id),
	);
	if (endNodeIdSet.size === 0) return false;

	const adjacencyList = new Map<NodeId, Set<NodeId>>();
	for (const connection of workspace.connections) {
		const fromNodeId = connection.outputNode.id;
		const toNodeId = connection.inputNode.id;
		const destinations = adjacencyList.get(fromNodeId) ?? new Set<NodeId>();
		destinations.add(toNodeId);
		adjacencyList.set(fromNodeId, destinations);
	}

	const visited = new Set<NodeId>();
	const queue: NodeId[] = [...startNodeIds];
	for (const startNodeId of startNodeIds) visited.add(startNodeId);

	while (queue.length > 0) {
		const currentNodeId = queue.shift();
		if (!currentNodeId) continue;

		if (endNodeIdSet.has(currentNodeId)) {
			return true;
		}

		const nextNodeIds = adjacencyList.get(currentNodeId);
		if (!nextNodeIds) continue;

		for (const nextNodeId of nextNodeIds) {
			if (visited.has(nextNodeId)) continue;
			visited.add(nextNodeId);
			queue.push(nextNodeId);
		}
	}

	return false;
}

export type AppStoreSlice = {
	hasStartNode: () => boolean;
	hasEndNode: () => boolean;
	isStartNodeConnectedToEndNode: () => boolean;
};

export const createAppStoreSlice: StateCreator<
	AppStore,
	[],
	[],
	AppStoreSlice
> = (_set, get) => ({
	hasStartNode: () => hasStartNode(get().workspace),
	hasEndNode: () => hasEndNode(get().workspace),
	isStartNodeConnectedToEndNode: () =>
		isStartNodeConnectedToEndNode(get().workspace),
});
