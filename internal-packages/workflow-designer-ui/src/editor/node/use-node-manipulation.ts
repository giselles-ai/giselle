import { Node } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useCallback } from "react";

// Position offset constants for better maintainability
const OFFSET_X = 200;
const OFFSET_Y = 100;

export function useNodeManipulation() {
	const { data, copyNode, copiedNode, setCopiedNode, setUiNodeState } =
		useWorkflowDesigner();

	const copy = useCallback(
		(onError?: () => void) => {
			const selectedNode = data.nodes.find(
				(node) => data.ui.nodeState[node.id]?.selected,
			);
			if (selectedNode) {
				setCopiedNode(selectedNode);
			} else {
				onError?.();
			}
		},
		[data.nodes, data.ui.nodeState, setCopiedNode],
	);

	const paste = useCallback(
		(onError?: () => void) => {
			if (!copiedNode) {
				onError?.();
				return;
			}

			const nodeState = data.ui.nodeState[copiedNode.id];
			if (!nodeState) {
				onError?.();
				return;
			}

			const position = {
				x: nodeState.position.x + OFFSET_X,
				y: nodeState.position.y + OFFSET_Y,
			};

			// Validate the copied node using Zod schema
			try {
				const validatedNode = Node.parse(copiedNode);
				copyNode(validatedNode, {
					ui: { position, selected: true },
				});
				setUiNodeState(copiedNode.id, { selected: false });
			} catch (error) {
				console.error("Failed to paste node - validation error:", error);
				onError?.();
			}
		},
		[copiedNode, data.ui.nodeState, copyNode, setUiNodeState],
	);

	const duplicate = useCallback(
		(nodeId?: string, onError?: () => void) => {
			const targetNodeLike = nodeId
				? data.nodes.find((node) => node.id === nodeId)
				: data.nodes.find((node) => data.ui.nodeState[node.id]?.selected);

			if (!targetNodeLike) {
				onError?.();
				return;
			}

			try {
				const targetNode = Node.parse(targetNodeLike);
				const nodeState = data.ui.nodeState[targetNode.id];
				if (!nodeState) {
					onError?.();
					return;
				}
				const position = {
					x: nodeState.position.x + OFFSET_X,
					y: nodeState.position.y + OFFSET_Y,
				};
				copyNode(targetNode, { ui: { position } });
			} catch (error) {
				console.error("Failed to duplicate node:", error);
				onError?.();
			}
		},
		[data, copyNode],
	);

	return {
		copy,
		paste,
		duplicate,
	};
}
