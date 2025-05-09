import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback } from "react";

export function useDuplicateNode() {
	const { data, copyNode } = useWorkflowDesigner();

	return useCallback(
		(nodeId?: string, onError?: () => void) => {
			const targetNode = nodeId
				? data.nodes.find((node) => node.id === nodeId)
				: data.nodes.find((node) => data.ui.nodeState[node.id]?.selected);

			if (!targetNode) {
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
