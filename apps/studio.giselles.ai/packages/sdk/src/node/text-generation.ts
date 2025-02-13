import { BaseNode, type BaseNodeData } from "./base";
import type { ConnectionHandle, NodeData, NodeId, NodeServices } from "./types";
import type { WorkflowData } from "./workflow-state";

export interface TextGenerationContent {
	type: "textGeneration";
	llm: `${string}:${string}`;
	temperature: number;
	topP: number;
	instruction: string;
	requirement?: ConnectionHandle;
	system?: string;
	sources: ConnectionHandle[];
}

export interface TextGenerationNodeData extends BaseNodeData {
	type: "action";
	content: TextGenerationContent;
}

export interface CreateTextGenerationNodeParams
	extends Omit<TextGenerationContent, "type"> {
	name: string;
}

export class TextGenerationNode extends BaseNode<TextGenerationNodeData> {
	constructor(
		nodeId: NodeId,
		workflowData: WorkflowData,
		private readonly nodeServices: NodeServices,
	) {
		super(nodeId, workflowData, isTextGenerationNode);
	}

	get type(): "action" {
		return "action";
	}

	get content(): TextGenerationContent {
		return this.getContent<TextGenerationContent>();
	}

	addSources(nodes: NodeData[]): void {
		this.nodeServices.addSources(nodes);
	}

	removeSources(nodes: NodeData[]): void {
		this.nodeServices.removeSources(nodes);
	}
}

export function isTextGenerationNode(node: {
	type: string;
	content: unknown;
}): node is { type: "action"; content: TextGenerationContent } {
	return (
		node.type === "action" &&
		(node.content as TextGenerationContent).type === "textGeneration"
	);
}
