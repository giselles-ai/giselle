import { type GroupedNodes, groupNodes } from "@giselles-ai/workspace-utils";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../../app-designer";

export function useNodeGroups(): GroupedNodes {
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));

	return useMemo(
		() => groupNodes({ nodes, connections }),
		[nodes, connections],
	);
}
