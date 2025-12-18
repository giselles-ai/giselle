import { NodeId } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useDeleteNodes } from "./use-delete-nodes";

export function useDeleteNode() {
	const deleteNodes = useDeleteNodes();

	return useCallback(
		(nodeIdToDelete: NodeId | string) => {
			const nodeId = NodeId.parse(nodeIdToDelete);
			void deleteNodes([nodeId]);
		},
		[deleteNodes],
	);
}
