import { useCallback } from "react";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";

export function useClearSelection() {
	const { nodeIds, selectedConnectionIds } = useAppDesignerStore((s) => ({
		nodeIds: s.nodes.map((n) => n.id),
		selectedConnectionIds: s.ui.selectedConnectionIds ?? [],
	}));
	const { setUiNodeState, deselectConnection } = useWorkspaceActions((s) => ({
		setUiNodeState: s.setUiNodeState,
		deselectConnection: s.deselectConnection,
	}));

	return useCallback(() => {
		for (const id of nodeIds) {
			setUiNodeState(id, { selected: false });
		}
		for (const connectionId of selectedConnectionIds) {
			deselectConnection(connectionId);
		}
	}, [deselectConnection, nodeIds, selectedConnectionIds, setUiNodeState]);
}
