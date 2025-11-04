import type {
	ConnectionId,
	NodeId,
	TriggerNode,
	Workspace,
} from "@giselle-ai/data-type";
import { isOperationNode, isTriggerNode } from "@giselle-ai/data-type";
import { sliceGraphFromNode } from "./slice-graph-from-node";

interface NodeGroup {
	nodeIds: NodeId[];
	connectionIds: ConnectionId[];
}

export interface GroupedNodes {
	operationNodeGroups: NodeGroup[];
	triggerNodeGroups: {
		node: TriggerNode;
		nodeGroup: NodeGroup;
	}[];
}

/**
 * Groups connected nodes in a workspace using Union-Find algorithm.
 * Splits groups by trigger nodes and returns structured object with operation and trigger node groups.
 */
export function groupNodes(
	workspace: Pick<Workspace, "nodes" | "connections">,
): GroupedNodes {
	const nodeIds = workspace.nodes.map((node) => node.id);

	// Initialize parent map - each node is its own parent initially
	const parent = new Map<NodeId, NodeId>();
	for (const nodeId of nodeIds) {
		parent.set(nodeId, nodeId);
	}

	// Find root with path compression
	function findRoot(nodeId: NodeId): NodeId {
		const parentId = parent.get(nodeId);
		if (!parentId || parentId === nodeId) {
			return nodeId;
		}
		// Path compression: make nodes point directly to root
		const root = findRoot(parentId);
		parent.set(nodeId, root);
		return root;
	}

	// Union two nodes by connecting their roots
	function union(nodeId1: NodeId, nodeId2: NodeId): void {
		const root1 = findRoot(nodeId1);
		const root2 = findRoot(nodeId2);
		if (root1 !== root2) {
			parent.set(root2, root1);
		}
	}

	// Connect nodes based on workspace connections
	for (const connection of workspace.connections) {
		union(connection.outputNode.id, connection.inputNode.id);
	}

	// Group nodes by their root
	const groups = new Map<NodeId, Set<NodeId>>();
	for (const nodeId of nodeIds) {
		const root = findRoot(nodeId);
		if (!groups.has(root)) {
			groups.set(root, new Set());
		}
		groups.get(root)?.add(nodeId);
	}

	// Build NodeGroup objects with connectionIds
	const nodeGroups: NodeGroup[] = [];
	for (const nodeIdSet of groups.values()) {
		const nodeIds = Array.from(nodeIdSet);
		const connectionIds = workspace.connections
			.filter(
				(connection) =>
					nodeIdSet.has(connection.outputNode.id) &&
					nodeIdSet.has(connection.inputNode.id),
			)
			.map((connection) => connection.id);

		nodeGroups.push({ nodeIds, connectionIds });
	}

	// Split groups by trigger nodes
	const operationNodeGroups: NodeGroup[] = [];
	const triggerNodeGroups: {
		node: TriggerNode;
		nodeGroup: NodeGroup;
	}[] = [];

	for (const group of nodeGroups) {
		const nodes = group.nodeIds
			.map((nodeId) => workspace.nodes.find((node) => node.id === nodeId))
			.filter((node) => node !== undefined);
		const connections = group.connectionIds
			.map((connectionId) =>
				workspace.connections.find(
					(connection) => connection.id === connectionId,
				),
			)
			.filter((connection) => connection !== undefined);
		const existOperationNode = nodes.find((node) => isOperationNode(node));
		if (!existOperationNode) {
			continue;
		}
		const triggerNodes = nodes.filter((node) => isTriggerNode(node));
		if (triggerNodes.length === 0) {
			operationNodeGroups.push(group);
			continue;
		}
		for (const triggerNode of triggerNodes) {
			const sliceGraph = sliceGraphFromNode(triggerNode, {
				nodes,
				connections,
			});
			triggerNodeGroups.push({
				node: triggerNode,
				nodeGroup: {
					nodeIds: sliceGraph.nodes.map((node) => node.id),
					connectionIds: sliceGraph.connections.map(
						(connection) => connection.id,
					),
				},
			});
		}
	}

	return {
		operationNodeGroups,
		triggerNodeGroups,
	};
}

/**
 * Find the node group containing the specified nodeId
 */
export function findNodeGroupByNodeId(
	workspace: Pick<Workspace, "nodes" | "connections">,
	nodeId: NodeId,
): NodeGroup | undefined {
	const groupedNodes = groupNodes(workspace);
	return (
		groupedNodes.operationNodeGroups.find((g) => g.nodeIds.includes(nodeId)) ??
		groupedNodes.triggerNodeGroups.find((g) =>
			g.nodeGroup.nodeIds.includes(nodeId),
		)?.nodeGroup
	);
}
