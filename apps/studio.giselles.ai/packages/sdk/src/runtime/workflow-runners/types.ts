import type { NodeData, NodeId } from "../../node/types";

export interface NodeRunnerContext {
	nodeId: NodeId;
	dependencies: Record<NodeId, unknown>; // Results from dependent nodes
}

export interface NodeRunner<T extends NodeData = NodeData> {
	canHandle(node: NodeData): boolean;
	run(node: T, context: NodeRunnerContext): Promise<unknown>;
}
