import type { NodeBase } from "@giselle-sdk/data-type";
import { useCallback } from "react";
import type { WorkspaceAction } from "./use-workspace-reducer";

export function useNodeUpdate(dispatch: React.Dispatch<WorkspaceAction>) {
	return useCallback(
		<T extends NodeBase>(node: T, data: Partial<T>) => {
			dispatch({ type: "UPDATE_NODE", nodeId: node.id, data });
		},
		[dispatch],
	);
}
