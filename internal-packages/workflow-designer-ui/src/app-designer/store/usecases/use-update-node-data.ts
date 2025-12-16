import type { NodeLike } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useUpdateNodeData() {
	const { updateNode } = useWorkspaceActions((s) => ({
		updateNode: s.updateNode,
	}));

	return useCallback(
		<T extends NodeLike>(node: T, data: Partial<T>) => {
			// `updateNode` is the low-level primitive; this is a convenience wrapper.
			updateNode(node.id, data as never);
		},
		[updateNode],
	);
}
