import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useUpdateWorkspaceName() {
	const { updateWorkspaceName } = useWorkspaceActions((s) => ({
		updateWorkspaceName: s.updateWorkspaceName,
	}));
	return useCallback(
		(name: string | undefined) => {
			updateWorkspaceName(name);
		},
		[updateWorkspaceName],
	);
}
