import type { Generation } from "@giselles-ai/protocol";
import {
	isImageGenerationNode,
	isTextGenerationNode,
} from "@giselles-ai/protocol";

/**
 * Extract model information from generation data
 */
export function getModelInfo(generation: Generation | undefined): {
	provider: string;
	modelName: string;
} {
	if (!generation) {
		return { provider: "Unknown", modelName: "Unknown" };
	}

	try {
		const operationNode = generation.context.operationNode;
		if (
			operationNode &&
			(isTextGenerationNode(operationNode) ||
				isImageGenerationNode(operationNode))
		) {
			const provider = operationNode.content.llm.provider;
			const modelName = operationNode.content.llm.id || provider;
			return { provider, modelName };
		}
	} catch (_error) {
		// If we can't access the operation node, fall back to defaults
	}
	return { provider: "Unknown", modelName: "Unknown" };
}
