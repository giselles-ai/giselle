import type { Node, NodeUIState } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useAddNode() {
	const actions = useWorkspaceActions((s) => ({
		addNode: s.addNode,
		upsertNodeUiState: s.upsertNodeUiState,
	}));
	return useCallback(
		(node: Node, ui: NodeUIState) => {
			actions.addNode(node);
			actions.upsertNodeUiState(node.id, ui);
		},
		[actions],
	);
}
