import { useCallback } from "react";
import { useAppDesignerStore } from "../hooks";
import { useSetSelectedConnectionIds } from "./use-set-selected-connection-ids";

export function useDeselectConnection() {
	const selectedConnectionIds = useAppDesignerStore(
		(s) => s.ui.selectedConnectionIds ?? [],
	);
	const setSelectedConnectionIds = useSetSelectedConnectionIds();

	return useCallback(
		(connectionId: string) => {
			setSelectedConnectionIds(
				selectedConnectionIds.filter((id) => id !== connectionId),
			);
		},
		[selectedConnectionIds, setSelectedConnectionIds],
	);
}
