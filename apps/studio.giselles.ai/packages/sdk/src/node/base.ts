import type { NodeData, NodeId } from "./types";
import type { WorkflowData } from "./workflow-state";

// Common interface for all nodes
export interface BaseNodeData {
	id: NodeId;
	name: string;
	type: string;
}

export abstract class BaseNode<T extends NodeData> {
	constructor(
		protected readonly nodeId: NodeId,
		protected readonly workflowData: WorkflowData,
		private readonly nodeTypeValidator: (node: {
			type: string;
			content: unknown;
		}) => boolean,
	) {
		// Validate node type at construction time
		const node = this.workflowData.nodes[this.nodeId].data;
		if (!this.nodeTypeValidator(node)) {
			throw new Error(`Invalid node type for ${this.constructor.name}`);
		}
	}

	get id(): NodeId {
		return this.nodeId;
	}

	get name(): string {
		return this.workflowData.nodes[this.nodeId].data.name;
	}

	abstract get type(): T["type"];

	protected getContent<C>(): C {
		const node = this.workflowData.nodes[this.nodeId].data;
		if (!this.nodeTypeValidator(node)) {
			throw new Error("Invalid node content");
		}
		return node.content as C;
	}
}
