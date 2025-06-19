import {
	type Connection,
	type NodeId,
	type NodeLike,
	type Workflow,
	WorkflowId,
} from "@giselle-sdk/data-type";
import {
	createDownstreamNodeIdMap,
	createJobMap,
	findConnectedConnectionMap,
	findDownstreamNodeMap,
} from "./helper";

/**
 * Builds a workflow starting from a specific node ID.
 * Only includes nodes that are connected to/from the starting node.
 *
 * @param startNodeId - The ID of the node to start building the workflow from
 * @param nodes - Array of all node objects
 * @param connections - Array of all connection objects
 * @returns A workflow object or null if the node doesn't exist or isn't an operation node
 */
export function buildWorkflowFromNode(
	startNodeId: NodeId,
	nodes: NodeLike[],
	connections: Connection[],
): Workflow | null {
	const nodeMap = new Map(nodes.map((node) => [node.id, node]));
	const connectionMap = new Map(
		connections.map((connection) => [connection.id, connection]),
	);
	const startNode = nodeMap.get(startNodeId);

	// Check if the node exists and is an operation node
	if (!startNode || startNode.type !== "operation") {
		return null;
	}

	// Create a map of downstream node IDs (output direction only)
	const downstreamNodeIdMap = createDownstreamNodeIdMap(
		new Set(connectionMap.values()),
		new Set(nodeMap.keys()),
	);

	// Find all downstream nodes from the starting node
	const downstreamNodeMap = findDownstreamNodeMap(
		startNodeId,
		nodeMap,
		downstreamNodeIdMap,
	);

	// Include variable nodes that provide inputs to the downstream nodes
	for (const connection of connectionMap.values()) {
		if (
			downstreamNodeMap.has(connection.inputNode.id) &&
			connection.outputNode.type === "variable"
		) {
			const variableNode = nodeMap.get(connection.outputNode.id);
			if (variableNode) {
				downstreamNodeMap.set(variableNode.id, variableNode);
			}
		}
	}

	// Find all connections between the connected nodes
	const connectedConnectionMap = findConnectedConnectionMap(
		new Set(downstreamNodeMap.keys()),
		new Set(connectionMap.values()),
	);

	// Generate a workflow ID
	const workflowId = WorkflowId.generate();

	// Create jobs based on the connected nodes and connections
	const jobSet = createJobMap(
		new Set(downstreamNodeMap.values()),
		new Set(connectedConnectionMap.values()),
		workflowId,
	);

	// Create and return the workflow
	return {
		id: workflowId,
		jobs: Array.from(jobSet.values()),
		nodes: Array.from(downstreamNodeMap.values()),
	};
}
