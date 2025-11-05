import type {
	Connection,
	ConnectionId,
	NodeId,
	NodeLike,
	Workspace,
} from "@giselles-ai/protocol";

export function sliceGraphFromNode(
	node: NodeLike,
	graph: Pick<Workspace, "connections" | "nodes">,
) {
	const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
	const forwardMap = new Map<NodeId, NodeId[]>();
	const referenceMap = new Map<NodeId, NodeId[]>();

	for (const connection of graph.connections) {
		if (!forwardMap.has(connection.outputNode.id)) {
			forwardMap.set(connection.outputNode.id, []);
		}
		forwardMap.get(connection.outputNode.id)?.push?.(connection.inputNode.id);

		if (!referenceMap.has(connection.inputNode.id)) {
			referenceMap.set(connection.inputNode.id, []);
		}
		referenceMap.get(connection.inputNode.id)?.push?.(connection.outputNode.id);
	}

	const visited = new Set<ConnectionId>();
	const sliceConnections: Connection[] = [];
	const sliceNodeMap = new Map<NodeId, NodeLike>();
	const queue: NodeId[] = [node.id];
	sliceNodeMap.set(node.id, node);

	// First, traverse backward from the starting node
	const backwardQueue: NodeId[] = [node.id];
	const processedBackward = new Set<NodeId>();

	while (backwardQueue.length > 0) {
		const current = backwardQueue.shift();
		if (current === undefined || processedBackward.has(current)) {
			continue;
		}
		processedBackward.add(current);

		const currentNode = nodeMap.get(current);
		if (currentNode === undefined) {
			continue;
		}

		// Get nodes that output to the current node (backward traversal)
		const predecessors = referenceMap.get(current) ?? [];
		for (const pred of predecessors) {
			const predNode = nodeMap.get(pred);
			if (predNode === undefined) {
				continue;
			}
			const connections = graph.connections.filter(
				(connection) =>
					connection.outputNode.id === predNode.id &&
					connection.inputNode.id === currentNode.id,
			);
			for (const connection of connections) {
				if (!visited.has(connection.id)) {
					sliceConnections.push(connection);
					sliceNodeMap.set(predNode.id, predNode);
					sliceNodeMap.set(currentNode.id, currentNode);
					visited.add(connection.id);
				}
			}
			// Continue backward traversal from operation nodes
			if (predNode.type === "operation") {
				backwardQueue.push(pred);
			}
		}
	}

	while (queue.length > 0) {
		const current = queue.shift();
		if (current === undefined) {
			continue;
		}
		const currentNode = nodeMap.get(current);
		if (currentNode === undefined) {
			continue;
		}

		const nexts = forwardMap.get(current) ?? [];
		for (const next of nexts) {
			const nextNode = nodeMap.get(next);
			if (nextNode === undefined) {
				continue;
			}
			const connections = graph.connections.filter(
				(connection) =>
					connection.outputNode.id === currentNode.id &&
					connection.inputNode.id === nextNode.id,
			);
			for (const connection of connections) {
				if (!visited.has(connection.id)) {
					sliceConnections.push(connection);
					sliceNodeMap.set(currentNode.id, currentNode);
					sliceNodeMap.set(nextNode.id, nextNode);
					visited.add(connection.id);
				}
			}

			if (nextNode.type === "operation" && !processedBackward.has(next)) {
				queue.push(next);
			}

			// Also perform backward traversal from nodes found during forward traversal
			const referencing = referenceMap.get(next) ?? [];
			for (const ref of referencing) {
				const refNode = nodeMap.get(ref);
				if (refNode === undefined) {
					continue;
				}
				const refConnections = graph.connections.filter(
					(connection) =>
						connection.outputNode.id === refNode.id &&
						connection.inputNode.id === nextNode.id,
				);
				for (const refConnection of refConnections) {
					if (!visited.has(refConnection.id)) {
						sliceConnections.push(refConnection);
						sliceNodeMap.set(nextNode.id, nextNode);
						sliceNodeMap.set(refNode.id, refNode);
						visited.add(refConnection.id);
					}
				}
			}
		}
	}

	return {
		nodes: [...sliceNodeMap.values().map((sliceNode) => sliceNode)],
		connections: sliceConnections,
	};
}
