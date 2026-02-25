import type { NodeLike, Schema } from "@giselles-ai/protocol";
import {
	isContentGenerationNode,
	isTextGenerationNode,
} from "@giselles-ai/protocol";

export function getNodeSchema(node: NodeLike): Schema | undefined {
	if (isTextGenerationNode(node) || isContentGenerationNode(node)) {
		if (node.content.output.format === "object") {
			return node.content.output.schema;
		}
	}
	return undefined;
}
