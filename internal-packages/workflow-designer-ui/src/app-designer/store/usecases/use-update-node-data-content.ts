import type { Node, NodeLike } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useWorkspaceActions } from "../hooks";

export function useUpdateNodeDataContent() {
	const store = useAppDesignerStoreApi();
	const { updateNode } = useWorkspaceActions((s) => ({
		updateNode: s.updateNode,
	}));

	return useCallback(
		<T extends Node>(nodeLike: NodeLike, content: Partial<T["content"]>) => {
			const current = store.getState().nodes.find((n) => n.id === nodeLike.id);
			if (!current) return;
			updateNode(nodeLike.id, {
				content: { ...current.content, ...content },
			} as never);
		},
		[store, updateNode],
	);
}
