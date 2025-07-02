import {
	type Connection,
	isOperationNode,
	type Job,
	JobId,
	Node,
	type NodeId,
	type NodeLike,
	type Operation,
	type WorkflowId,
} from "@giselle-sdk/data-type";

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
 * @returns Array of jobs for the workflow
 */
export function buildJobList(
	nodes: NodeLike[],
	connections: Connection[],
	workflowId: WorkflowId,
) {
	const nodeSet = new Set(nodes);
	const connectionSet = new Set(connections);

	/**
	 * Calculates the number of incoming edges for each node.
	 * Handles duplicate connections between the same nodes.
	 */
	const calculateInDegrees = (
		nodeIdSet: Set<NodeId>,
		connectionSet: Set<Connection>,
	): Record<NodeId, number> => {
		const inDegrees: Record<NodeId, number> = {};
		const processedNodeIdRecord: Record<NodeId, Set<NodeId>> = {};

		for (const nodeId of nodeIdSet) {
			inDegrees[nodeId] = 0;
		}

		for (const conn of connectionSet) {
			const processedOutputNodes =
				processedNodeIdRecord[conn.inputNode.id] ?? new Set();
			if (processedOutputNodes.has(conn.outputNode.id)) {
				continue;
			}
			processedOutputNodes.add(conn.outputNode.id);
			processedNodeIdRecord[conn.inputNode.id] = processedOutputNodes;

			const currentDegree = inDegrees[conn.inputNode.id] || 0;
			inDegrees[conn.inputNode.id] = currentDegree + 1;
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
			if (inDegrees[nodeId] === 0) {
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
					const newDegree = (inDegrees[childNodeId] || 0) - 1;
					inDegrees[childNodeId] = newDegree;
					if (newDegree === 0) {
						nextLevel.add(childNodeId);
					}
				}
			}

			currentLevel = nextLevel;
		}

		return levels;
	};

	// Filter for operation nodes and connections between operation nodes only
	const operationNodeIdSet = new Set<NodeId>();
	for (const node of nodeSet) {
		if (node.type === "operation") {
			operationNodeIdSet.add(node.id);
		}
	}
	const operationConnectionSet = new Set<Connection>();
	for (const connection of connectionSet) {
		if (
			connection.outputNode.type === "operation" &&
			connection.inputNode.type === "operation"
		) {
			operationConnectionSet.add(connection);
		}
	}
	const levels = topologicalSort(operationNodeIdSet, operationConnectionSet);

	// Create jobs based on the topological levels
	const jobs: Job[] = [];
	for (const level of levels) {
		const jobId = JobId.generate();
		const nodes = Array.from(nodeSet)
			.filter((node) => level.has(node.id))
			.filter((node) => isOperationNode(node));
		const operations = nodes.map((node) => {
			const connectionArray = Array.from(connectionSet);
			const nodeArray = Array.from(nodeSet);

			const connectedConnections = connectionArray.filter(
				(connection) => connection.inputNode.id === node.id,
			);

			// Map through each input to find source nodes, preserving duplicates
			const sourceNodes = node.inputs
				.map((input) => {
					// Find connections for this specific input
					const inputConnections = connectedConnections.filter(
						(connection) => connection.inputId === input.id,
					);
					// For each input connection, find the corresponding source node
					if (inputConnections.length > 0) {
						const sourceNodeId = inputConnections[0].outputNode.id;
						const node = nodeArray.find((n) => n.id === sourceNodeId);
						const parseResult = Node.safeParse(node);
						if (parseResult.success) {
							return parseResult.data;
						}
						return undefined;
					}
					return undefined;
				})
				.filter((node) => node !== undefined);
			return {
				node,
				sourceNodes,
				connections: connectedConnections,
			} satisfies Operation;
		});

		const job = {
			id: jobId,
			operations,
			workflowId,
		} satisfies Job;
		jobs.push(job);
	}
	return jobs;
}
