import type { NodeId } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";

export function useSelectSingleNode() {
	const nodeIds = useAppDesignerStore((s) => s.nodes.map((n) => n.id));
	const { setUiNodeState } = useWorkspaceActions((s) => ({
		setUiNodeState: s.setUiNodeState,
	}));

	return useCallback(
		(nodeId: NodeId | string) => {
			for (const id of nodeIds) {
				setUiNodeState(id, { selected: id === nodeId });
			}
		},
		[nodeIds, setUiNodeState],
	);
}
