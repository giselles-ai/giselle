import {
	type Connection,
	isAppEntryNode,
	isEndNode,
	type NodeId,
	type NodeLike,
} from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { AppDesignerStoreState } from "../app-designer-store";

function hasStartNode(nodes: NodeLike[]) {
	return nodes.some((node) => isAppEntryNode(node));
}

function hasEndNode(nodes: NodeLike[]) {
	return nodes.some((node) => isEndNode(node));
}

function isStartNodeConnectedToEndNode(
	nodes: NodeLike[],
	connections: Connection[],
) {
	const startNodeIds: NodeId[] = nodes
		.filter((node) => isAppEntryNode(node))
		.map((node) => node.id);
	if (startNodeIds.length === 0) return false;

	const endNodeIdSet = new Set<NodeId>(
		nodes.filter((node) => isEndNode(node)).map((node) => node.id),
	);
	if (endNodeIdSet.size === 0) return false;

	const adjacencyList = new Map<NodeId, Set<NodeId>>();
	for (const connection of connections) {
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

export type AppSlice = {
	hasStartNode: () => boolean;
	hasEndNode: () => boolean;
	isStartNodeConnectedToEndNode: () => boolean;
};

export const createAppSlice: StateCreator<
	AppDesignerStoreState,
	[],
	[],
	AppSlice
> = (_set, get) => ({
	hasStartNode: () => hasStartNode(get().nodes),
	hasEndNode: () => hasEndNode(get().nodes),
	isStartNodeConnectedToEndNode: () =>
		isStartNodeConnectedToEndNode(get().nodes, get().connections),
});
