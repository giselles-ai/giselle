import { BaseNode, type BaseNodeData } from "./base";
import type { NodeId } from "./types";
import type { WorkflowData } from "./workflow-state";

export interface TextContent {
	type: "text";
	text: string;
}

export interface TextNodeData extends BaseNodeData {
	type: "variable";
	content: TextContent;
}

export interface CreateTextNodeParams extends Omit<TextContent, "type"> {
	name: string;
}

export class TextNode extends BaseNode<TextNodeData> {
	constructor(nodeId: NodeId, workflowData: WorkflowData) {
		super(nodeId, workflowData, isTextNode);
	}

	get type(): "variable" {
		return "variable";
	}

	get content(): TextContent {
		return this.getContent<TextContent>();
	}
}

export function isTextNode(node: { type: string; content: unknown }): node is {
	type: "variable";
	content: TextContent;
} {
	return (
		node.type === "variable" && (node.content as TextContent).type === "text"
	);
}
