import type { NodeId } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useUiActions } from "../hooks";

export function useCopyNodeToClipboard() {
	const store = useAppDesignerStoreApi();
	const { setClipboardNode } = useUiActions((s) => ({
		setClipboardNode: s.setClipboardNode,
	}));

	return useCallback(
		(args?: { nodeId?: NodeId | string; onError?: () => void }) => {
			const state = store.getState();
			const targetNode = args?.nodeId
				? state.nodes.find((n) => n.id === args.nodeId)
				: state.nodes.find((n) => state.ui.nodeState[n.id]?.selected);
			if (!targetNode) {
				args?.onError?.();
				return;
			}
			setClipboardNode(targetNode);
		},
		[setClipboardNode, store],
	);
}
