import type { Connection } from "./connection";
import type { NodeId, NodeUIState } from "./types";
import type { NodeData } from "./types";

export interface WorkflowData {
	nodes: Record<NodeId, { data: NodeData }>;
	connections: Connection[];
	ui: {
		nodeStates: Record<NodeId, NodeUIState>;
	};
	version: string;
}
