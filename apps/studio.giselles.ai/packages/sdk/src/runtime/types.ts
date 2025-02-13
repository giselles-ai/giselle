import type { NodeId } from "../node/types";

export interface RuntimeConfiguration {
	maxRetries?: number;
	retryDelay?: number; // milliseconds
}

export interface NodeRunResult {
	nodeId: NodeId;
	output: unknown;
	error?: Error;
	retryCount?: number;
}

export interface WorkflowRunResult {
	success: boolean;
	results: Record<NodeId, NodeRunResult>;
	error?: Error;
}

export interface NodeDependencyGraph {
	[nodeId: NodeId]: {
		dependencyActions: NodeId[];
		dependencyVariables: NodeId[];
		dependents: NodeId[];
	};
}
