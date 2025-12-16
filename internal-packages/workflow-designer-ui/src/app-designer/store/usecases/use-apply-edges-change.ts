import type { EdgeChange, OnEdgesChange } from "@xyflow/react";
import { useCallback } from "react";
import { useDeleteConnection } from "./use-delete-connection";
import { useDeselectConnection } from "./use-deselect-connection";
import { useSelectConnection } from "./use-select-connection";

export function useApplyEdgesChange(): OnEdgesChange {
	const selectConnection = useSelectConnection();
	const deselectConnection = useDeselectConnection();
	const deleteConnection = useDeleteConnection();

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
