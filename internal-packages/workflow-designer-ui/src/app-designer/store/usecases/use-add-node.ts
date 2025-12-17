import type { NodeLike, NodeUIState } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";
import { useAutoConfigureAppEntryNode } from "./use-auto-configure-app-entry-node";

export function useAddNode() {
	const actions = useWorkspaceActions((s) => ({
		addNode: s.addNode,
		upsertUiNodeState: s.upsertUiNodeState,
	}));
	const autoConfigureAppEntryNode = useAutoConfigureAppEntryNode();
	return useCallback(
		(node: NodeLike, ui?: NodeUIState) => {
			actions.addNode(node);
			if (ui) {
				actions.upsertUiNodeState(node.id, ui);
			}
			void autoConfigureAppEntryNode(node);
		},
		[actions, autoConfigureAppEntryNode],
	);
}
