import type { EdgeChange, OnEdgesChange } from "@xyflow/react";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useApplyEdgesChange(): OnEdgesChange {
	const { selectConnection, deselectConnection, deleteConnection } =
		useWorkspaceActions((s) => ({
			selectConnection: s.selectConnection,
			deselectConnection: s.deselectConnection,
			deleteConnection: s.deleteConnection,
		}));

	return useCallback<OnEdgesChange>(
		(changes: EdgeChange[]) => {
			for (const change of changes) {
				switch (change.type) {
					case "select":
						if (change.selected) {
							selectConnection(change.id);
						} else {
							deselectConnection(change.id);
						}
						break;
					case "remove": {
						deleteConnection(change.id);
						break;
					}
				}
			}
		},
		[deselectConnection, deleteConnection, selectConnection],
	);
}
