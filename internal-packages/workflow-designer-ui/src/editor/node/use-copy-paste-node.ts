import { Node, type NodeLike } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useCallback, useState } from "react";

export function useCopyPasteNode() {
	const { data, copyNode } = useWorkflowDesigner();
	const [copiedNode, setCopiedNode] = useState<NodeLike | null>(null);

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
		[data.nodes, data.ui.nodeState],
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

			// Position offset constants for better maintainability
			const PASTE_OFFSET_X = 200;
			const PASTE_OFFSET_Y = 100;

			const position = {
				x: nodeState.position.x + PASTE_OFFSET_X,
				y: nodeState.position.y + PASTE_OFFSET_Y,
			};

			// Validate the copied node using Zod schema
			try {
				const validatedNode = Node.parse(copiedNode);
				copyNode(validatedNode, { ui: { position } });
			} catch (error) {
				console.error("Failed to paste node - validation error:", error);
				onError?.();
			}
		},
		[copiedNode, data.ui.nodeState, copyNode],
	);

	return { copy, paste, hasCopiedNode: copiedNode !== null };
}
