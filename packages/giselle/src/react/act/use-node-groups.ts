import { useMemo } from "react";
import {
	type GroupedNodes,
	groupNodes,
} from "../../engine/utils/workspace/group-nodes";
import { useWorkflowDesigner } from "../workspace";

/**
 * Custom hook that groups connected nodes in the current workspace.
 * Returns an object with operation and trigger node groups.
 */
export function useNodeGroups() {
	const { data } = useWorkflowDesigner();

	return useMemo<GroupedNodes>(() => {
		if (!data || !data.nodes || !data.connections) {
			return {
				operationNodeGroups: [],
				starterNodeGroups: [],
			};
		}
		return groupNodes(data);
	}, [data]);
}
