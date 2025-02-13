import { TextNode, isTextNode } from "./text";
import { TextGenerationNode, isTextGenerationNode } from "./text-generation";
import type { NodeId, NodeServices } from "./types";
import type { NodeData } from "./types";
import type { WorkflowData } from "./workflow-state";

// Factory function
export function createNodeInstance(
	nodeId: NodeId,
	workflowData: WorkflowData,
	nodeServices: NodeServices,
): NodeData {
	const node = workflowData.nodes[nodeId].data;

	if (isTextGenerationNode(node)) {
		return new TextGenerationNode(nodeId, workflowData, nodeServices);
	}
	if (isTextNode(node)) {
		return new TextNode(nodeId, workflowData);
	}

	throw new Error(`Unknown node type: ${(node as { type: string }).type}`);
}
