import type { NodeId } from "../node/types.ts";
import type { WorkflowData } from "../node/workflow-state.ts";
import type { NodeDependencyGraph } from "./types";

export class DependencyResolver {
	private graph: NodeDependencyGraph = {};

	constructor(private workflowData: WorkflowData) {
		this.buildDependencyGraph();
	}

	private buildDependencyGraph(): void {
		// Initialize graph
		for (const [nodeId, node] of Object.entries(this.workflowData.nodes)) {
			if (node.data.type !== "action") {
				continue;
			}
			this.graph[nodeId as NodeId] = {
				dependencyActions: [],
				dependencyVariables: [],
				dependents: [],
			};
		}

		// Build connections
		for (const connection of this.workflowData.connections) {
			const { sourceNodeId, targetNodeId, sourceNodeType } = connection;
			if (sourceNodeType === "variable") {
				this.graph[targetNodeId].dependencyVariables.push(sourceNodeId);
			}
			if (sourceNodeType === "action") {
				this.graph[targetNodeId].dependencyActions.push(sourceNodeId);
				this.graph[sourceNodeId].dependents.push(targetNodeId);
			}
		}
	}

	getExecutionOrder(): NodeId[] {
		const visited = new Set<NodeId>();
		const temp = new Set<NodeId>();
		const order: NodeId[] = [];

		const visit = (nodeId: NodeId) => {
			if (temp.has(nodeId)) {
				throw new Error("Circular dependency detected");
			}
			if (visited.has(nodeId)) return;

			temp.add(nodeId);

			for (const depId of this.graph[nodeId].dependencyActions) {
				visit(depId);
			}

			temp.delete(nodeId);
			visited.add(nodeId);
			order.push(nodeId);
		};

		for (const nodeId of Object.keys(this.graph)) {
			if (!visited.has(nodeId as NodeId)) {
				visit(nodeId as NodeId);
			}
		}

		return order;
	}

	getDependencyActions(nodeId: NodeId): NodeId[] {
		return this.graph[nodeId].dependencyActions;
	}
	getDependencyVariables(nodeId: NodeId): NodeId[] {
		return this.graph[nodeId].dependencyVariables;
	}

	getDependents(nodeId: NodeId): NodeId[] {
		return this.graph[nodeId].dependents;
	}
}
