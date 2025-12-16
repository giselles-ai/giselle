import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useSetSelectedConnectionIds() {
	const { setSelectedConnectionIds } = useWorkspaceActions((s) => ({
		setSelectedConnectionIds: s.setSelectedConnectionIds,
	}));

	return useCallback(
		(connectionIds: string[]) => {
			setSelectedConnectionIds(connectionIds);
		},
		[setSelectedConnectionIds],
	);
}
