import type { NodeLike, NodeUIState } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useAddNode() {
	const actions = useWorkspaceActions((s) => ({
		addNode: s.addNode,
	}));
	return useCallback(
		(node: NodeLike, ui: NodeUIState) => {
			actions.addNode(node, ui);
		},
		[actions],
	);
}
