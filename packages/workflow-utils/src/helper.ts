import {
	type Action,
	type ActionNode,
	type Connection,
	type ConnectionId,
	GenerationContext,
	type GenerationTemplate,
	type Job,
	JobId,
	type Node,
	type NodeId,
	type WorkflowId,
	isActionNode,
} from "@giselle-sdk/data-type";

type ConnectedNodeIdMap = Map<NodeId, Set<NodeId>>;

/**
 * Creates a map of node IDs to their connected node IDs.
 * This maintains a bidirectional mapping of connections between nodes.
 */
export function createConnectedNodeIdMap(
	connectionSet: Set<Connection>,
	nodeIdSet: Set<NodeId>,
) {
	const connectionMap: ConnectedNodeIdMap = new Map();
	for (const connection of connectionSet) {
		if (
			!nodeIdSet.has(connection.outputNode.id) ||
			!nodeIdSet.has(connection.inputNode.id)
		) {
			continue;
		}
		if (!connectionMap.has(connection.outputNode.id)) {
			connectionMap.set(connection.outputNode.id, new Set());
		}
		const sourceSet = connectionMap.get(connection.outputNode.id);
		if (sourceSet) {
			sourceSet.add(connection.inputNode.id);
		}

		if (!connectionMap.has(connection.inputNode.id)) {
			connectionMap.set(connection.inputNode.id, new Set());
		}
		const targetSet = connectionMap.get(connection.inputNode.id);
		if (targetSet) {
			targetSet.add(connection.outputNode.id);
		}
	}
	return connectionMap;
}

/**
 * Finds all nodes connected to a starting node using breadth-first search.
 * Returns a map of node IDs to their node objects.
 */
export function findConnectedNodeMap(
	startNodeId: NodeId,
	nodeMap: Map<NodeId, Node>,
	connectionMap: ConnectedNodeIdMap,
): Map<NodeId, Node> {
	const connectedNodeMap = new Map<NodeId, Node>();
	const stack: NodeId[] = [startNodeId];

	while (stack.length > 0) {
		const currentNodeId = stack.pop() || startNodeId;
		if (connectedNodeMap.has(currentNodeId)) continue;
		const currentNode = nodeMap.get(currentNodeId);
		if (currentNode === undefined) continue;

		connectedNodeMap.set(currentNodeId, currentNode);

		const connectedNodeIdSet = connectionMap.get(currentNodeId);
		if (connectedNodeIdSet) {
			for (const connectedNodeId of connectedNodeIdSet) {
				if (!connectedNodeMap.has(connectedNodeId)) {
					stack.push(connectedNodeId);
				}
			}
		}
	}

	return connectedNodeMap;
}

/**
 * Finds all connections between a set of connected nodes.
 * Returns a map of connection IDs to their connection objects.
 */
export function findConnectedConnectionMap(
	connectedNodeIdSet: Set<NodeId>,
	allConnectionSet: Set<Connection>,
) {
	const connectedConnectionMap = new Map<ConnectionId, Connection>();

	for (const connection of allConnectionSet) {
		if (
			connectedNodeIdSet.has(connection.outputNode.id) &&
			connectedNodeIdSet.has(connection.inputNode.id)
		) {
			connectedConnectionMap.set(connection.id, connection);
		}
	}

	return connectedConnectionMap;
}

/**
 * Converts a directed graph into a sequence of jobs with steps based on topological sorting.
 *
 * Input Graph:          Output Jobs:
 * A → B → D             Job1: [A]
 * ↓   ↓                 Job2: [B, C]
 * C → E                 Job3: [D, E]
 *
 * @param nodeSet The set of nodes in the workflow
 * @param connectionSet The set of connections between nodes
 * @param workflowId The ID of the workflow
 * @returns Map of job IDs to job objects
 */
export function createJobMap(
	nodeSet: Set<Node>,
	connectionSet: Set<Connection>,
	workflowId: WorkflowId,
) {
	/**
	 * Calculates the number of incoming edges for each node.
	 * Handles duplicate connections between the same nodes.
	 */
	const calculateInDegrees = (
		nodeIdSet: Set<NodeId>,
		connectionSet: Set<Connection>,
	): Map<string, number> => {
		const inDegrees = new Map<NodeId, number>();
		const processedNodeIdSet = new Map<NodeId, Set<NodeId>>();

		for (const nodeId of nodeIdSet) {
			inDegrees.set(nodeId, 0);
		}

		for (const conn of connectionSet) {
			const processedOutputNodes =
				processedNodeIdSet.get(conn.inputNode.id) ?? new Set();
			if (processedOutputNodes?.has(conn.outputNode.id)) {
				continue;
			}
			processedOutputNodes.add(conn.outputNode.id);
			processedNodeIdSet.set(conn.inputNode.id, processedOutputNodes);

			const currentDegree = inDegrees.get(conn.inputNode.id) || 0;
			inDegrees.set(conn.inputNode.id, currentDegree + 1);
		}

		return inDegrees;
	};

	/**
	 * Gets all direct child nodes of a given node.
	 */
	const getChildNodes = (
		nodeId: NodeId,
		connectionSet: Set<Connection>,
	): Set<NodeId> => {
		const childNodeIdSet = new Set<NodeId>();
		for (const connection of connectionSet) {
			if (connection.outputNode.id !== nodeId) {
				continue;
			}
			childNodeIdSet.add(connection.inputNode.id);
		}
		return childNodeIdSet;
	};

	/**
	 * Performs topological sort and groups nodes by levels.
	 * Each level contains nodes that can be processed in parallel.
	 */
	const topologicalSort = (
		nodeIdSet: Set<NodeId>,
		connectionSet: Set<Connection>,
	): Set<Set<NodeId>> => {
		const inDegrees = calculateInDegrees(nodeIdSet, connectionSet);
		const levels = new Set<Set<NodeId>>();
		let currentLevel = new Set<NodeId>();

		// Add all nodes with no incoming edges to the first level
		for (const nodeId of nodeIdSet) {
			if (inDegrees.get(nodeId) === 0) {
				currentLevel.add(nodeId);
			}
		}

		while (currentLevel.size > 0) {
			levels.add(new Set(currentLevel));
			const nextLevel = new Set<NodeId>();

			// For each node in the current level, reduce the in-degree of its children
			for (const nodeId of currentLevel) {
				const childrenNodeIdSet = getChildNodes(nodeId, connectionSet);
				for (const childNodeId of childrenNodeIdSet) {
					const newDegree = (inDegrees.get(childNodeId) || 0) - 1;
					inDegrees.set(childNodeId, newDegree);
					if (newDegree === 0) {
						nextLevel.add(childNodeId);
					}
				}
			}

			currentLevel = nextLevel;
		}

		return levels;
	};

	/**
	 * Creates a generation context for an action node by finding its source nodes.
	 */
	function createGenerationContext(node: ActionNode): GenerationTemplate {
		const connectionArray = Array.from(connectionSet);
		const nodeArray = Array.from(nodeSet);

		const sourceNodes = node.inputs
			.map((input) => {
				const connections = connectionArray.filter(
					(connection) => connection.inputId === input.id,
				);
				return nodeArray.find((tmpNode) =>
					connections.some(
						(connection) => connection.outputNode.id === tmpNode.id,
					),
				);
			})
			.filter((node) => node !== undefined);
		return {
			actionNode: node,
			sourceNodes,
		};
	}

	// Filter for action nodes and connections
	const actionNodeIdSet = new Set<NodeId>();
	for (const node of nodeSet) {
		if (node.type === "action") {
			actionNodeIdSet.add(node.id);
		}
	}
	const actionConnectionSet = new Set<Connection>();
	for (const connection of connectionSet) {
		if (connection.outputNode.type === "action") {
			actionConnectionSet.add(connection);
		}
	}
	const levels = topologicalSort(actionNodeIdSet, actionConnectionSet);

	// Create jobs based on the topological levels
	const jobMap = new Map<JobId, Job>();
	for (const level of levels) {
		const jobId = JobId.generate();
		const nodes = Array.from(nodeSet)
			.filter((node) => level.has(node.id))
			.filter((node) => isActionNode(node));
		const actions = nodes.map(
			(node) =>
				({
					node,
					generationTemplate: createGenerationContext(node),
				}) satisfies Action,
		);

		const job = {
			id: jobId,
			actions,
			workflowId,
		} satisfies Job;
		jobMap.set(job.id, job);
	}
	return jobMap;
}
