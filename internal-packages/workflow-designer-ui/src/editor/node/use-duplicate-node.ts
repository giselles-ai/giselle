import { Node } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback } from "react";

export function useDuplicateNode() {
	const { data, copyNode } = useWorkflowDesigner();

	return useCallback(
		(nodeId?: string, onError?: () => void) => {
			const targetNodeLike = nodeId
				? data.nodes.find((node) => node.id === nodeId)
				: data.nodes.find((node) => data.ui.nodeState[node.id]?.selected);

			if (!targetNodeLike) {
				onError?.();
				return;
			}

			let targetNode: Node;
			try {
				targetNode = Node.parse(targetNodeLike);
			} catch (error) {
				console.error(
					"Failed to parse target node for duplication:",
					error,
					targetNodeLike,
				);
				onError?.();
				return;
			}

			const nodeState = data.ui.nodeState[targetNode.id];
			if (!nodeState) return;

			const position = {
				x: nodeState.position.x + 200,
				y: nodeState.position.y + 100,
			};

			copyNode(targetNode, { ui: { position } });
		},
		[data, copyNode],
	);
}
