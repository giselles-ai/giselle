import type { NodeChange, OnNodesChange } from "@xyflow/react";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useApplyNodesChange(): OnNodesChange {
	const { setUiNodeState, deleteNode } = useWorkspaceActions((s) => ({
		setUiNodeState: s.setUiNodeState,
		deleteNode: s.deleteNode,
	}));

	return useCallback<OnNodesChange>(
		(changes: NodeChange[]) => {
			for (const change of changes) {
				switch (change.type) {
					case "position": {
						if (change.position === undefined) break;
						setUiNodeState(change.id, { position: change.position });
						break;
					}
					case "dimensions": {
						setUiNodeState(change.id, {
							measured: {
								width: change.dimensions?.width,
								height: change.dimensions?.height,
							},
						});
						break;
					}
					case "select": {
						setUiNodeState(change.id, { selected: change.selected });
						break;
					}
					case "remove": {
						deleteNode(change.id);
						break;
					}
				}
			}
		},
		[deleteNode, setUiNodeState],
	);
}
