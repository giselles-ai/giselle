import { useMemo } from "react";
import {
	type GroupedNodes,
	groupNodes,
} from "../../engine/runtime/utils/workspace/group-nodes";
import { useWorkflowDesigner } from "../workspace";

/**
 * Custom hook that groups connected nodes in the current workspace.
 * Returns an object with operation and trigger node groups.
 */
export function useNodeGroups() {
	const { data } = useWorkflowDesigner();

	return useMemo<GroupedNodes>(() => groupNodes(data), [data]);
}
