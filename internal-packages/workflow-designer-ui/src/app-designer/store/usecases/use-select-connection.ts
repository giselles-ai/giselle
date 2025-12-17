import { useCallback } from "react";
import { useAppDesignerStore } from "../hooks";
import { useSetSelectedConnectionIds } from "./use-set-selected-connection-ids";

export function useSelectConnection() {
	const selectedConnectionIds = useAppDesignerStore(
		(s) => s.ui.selectedConnectionIds ?? [],
	);
	const setSelectedConnectionIds = useSetSelectedConnectionIds();

	return useCallback(
		(connectionId: string) => {
			if (
				selectedConnectionIds.some(
					(selectedConnectionId) => selectedConnectionId === connectionId,
				)
			) {
				return;
			}
			setSelectedConnectionIds([...selectedConnectionIds, connectionId]);
		},
		[selectedConnectionIds, setSelectedConnectionIds],
	);
}
