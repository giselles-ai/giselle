import { useCallback } from "react";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";
import { useSetSelectedConnectionIds } from "./use-set-selected-connection-ids";

export function useClearSelection() {
	const { nodeIds, selectedConnectionIds } = useAppDesignerStore((s) => ({
		nodeIds: s.nodes.map((n) => n.id),
		selectedConnectionIds: s.ui.selectedConnectionIds ?? [],
	}));
	const { setUiNodeState } = useWorkspaceActions((s) => ({
		setUiNodeState: s.setUiNodeState,
	}));
	const setSelectedConnectionIds = useSetSelectedConnectionIds();

	return useCallback(() => {
		for (const id of nodeIds) {
			setUiNodeState(id, { selected: false });
		}
		if (selectedConnectionIds.length > 0) {
			setSelectedConnectionIds([]);
		}
	}, [
		nodeIds,
		selectedConnectionIds.length,
		setSelectedConnectionIds,
		setUiNodeState,
	]);
}
