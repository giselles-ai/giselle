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
 * @param graph The input graph with nodes and connections
 * @returns Set of jobs where each job contains steps that can be executed in parallel
 */
export function createJobMap(
	nodeSet: Set<Node>,
	connectionSet: Set<Connection>,
	workflowId: WorkflowId,
) {
	/**
	 * Calculates the number of incoming edges for each node.
	 *
	 * Example:
	 * A → B → C
	 * ↓   ↓
	 * D → E
	 *
	 * Results:
	 * A: 0
	 * B: 1
	 * C: 1
	 * D: 1
	 * E: 2
	 */
	const calculateInDegrees = (
		nodeIdSet: Set<NodeId>,
		connectionSet: Set<Connection>,
	): Map<string, number> => {
		const inDegrees = new Map<NodeId, number>();

		for (const nodeId of nodeIdSet) {
			inDegrees.set(nodeId, 0);
		}

		for (const conn of connectionSet) {
			const currentDegree = inDegrees.get(conn.inputNode.id) || 0;
			inDegrees.set(conn.inputNode.id, currentDegree + 1);
		}

		return inDegrees;
	};

	/**
	 * Gets all direct child nodes of a given node.
	 *
	 * Example:
	 * For node A in:
	 * A → B
	 * ↓
	 * C
	 *
	 * Returns: [B, C]
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
	 *
	 * Example graph:       Result levels:
	 * A → B → D            Level 1: [A]
	 * ↓   ↓                Level 2: [B, C]
	 * C → E                Level 3: [D, E]
	 *
	 * Each level contains nodes that can be processed in parallel
	 */
	const topologicalSort = (
		nodeIdSet: Set<NodeId>,
		connectionSet: Set<Connection>,
	): Set<Set<NodeId>> => {
		const inDegrees = calculateInDegrees(nodeIdSet, connectionSet);
		const levels = new Set<Set<NodeId>>();
		let currentLevel = new Set<NodeId>();

		for (const nodeId of nodeIdSet) {
			if (inDegrees.get(nodeId) === 0) {
				currentLevel.add(nodeId);
			}
		}

		while (currentLevel.size > 0) {
			levels.add(new Set(currentLevel));
			const nextLevel = new Set<NodeId>();

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
