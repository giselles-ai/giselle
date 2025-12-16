import type { NodeLike, NodeUIState } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useAddNode() {
	const actions = useWorkspaceActions((s) => ({
		addNode: s.addNode,
		upsertUiNodeState: s.upsertUiNodeState,
	}));
	return useCallback(
		(node: NodeLike, ui?: NodeUIState) => {
			actions.addNode(node);
			if (ui) {
				actions.upsertUiNodeState(node.id, ui);
			}
		},
		[actions],
	);
}
