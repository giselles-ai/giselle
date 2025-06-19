import type {
	Connection,
	ConnectionId,
	NodeId,
	NodeLike,
	Workspace,
} from "@giselle-sdk/data-type";

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
			const connection = graph.connections.find(
				(connection) =>
					connection.outputNode.id === currentNode.id &&
					connection.inputNode.id === nextNode.id,
			);
			if (connection === undefined) {
				continue;
			}
			if (!visited.has(connection.id)) {
				sliceConnections.push(connection);
				sliceNodeMap.set(currentNode.id, currentNode);
				sliceNodeMap.set(nextNode.id, nextNode);
				visited.add(connection.id);
			}

			if (nextNode.type === "operation") {
				queue.push(next);
			}

			const referencing = referenceMap.get(next) ?? [];
			for (const ref of referencing) {
				const refNode = nodeMap.get(ref);
				if (refNode === undefined) {
					continue;
				}
				const refConnection = graph.connections.find(
					(connection) =>
						connection.outputNode.id === refNode.id &&
						connection.inputNode.id === nextNode.id,
				);
				if (refConnection === undefined) {
					continue;
				}

				if (refNode.type === "variable") {
					if (!visited.has(refConnection.id)) {
						sliceConnections.push(refConnection);
						sliceNodeMap.set(currentNode.id, currentNode);
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
