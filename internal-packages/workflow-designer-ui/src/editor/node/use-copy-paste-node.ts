import type { Node, NodeLike } from "@giselle-sdk/data-type";
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

			const position = {
				x: nodeState.position.x + 200,
				y: nodeState.position.y + 100,
			};

			// Type guard: ensure copiedNode is a proper Node, not just NodeLike
			if (copiedNode.type === "operation" || copiedNode.type === "variable") {
				try {
					copyNode(copiedNode as Node, { ui: { position } });
				} catch (error) {
					console.error("Failed to paste node:", error, copiedNode);
					onError?.();
				}
			} else {
				onError?.();
			}
		},
		[copiedNode, data.ui.nodeState, copyNode],
	);

	return { copy, paste, hasCopiedNode: copiedNode !== null };
}
