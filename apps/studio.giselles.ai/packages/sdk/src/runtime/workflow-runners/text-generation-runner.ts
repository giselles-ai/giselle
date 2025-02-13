import type { TextGenerationNodeData } from "../../node/text-generation";
import { isTextGenerationNode } from "../../node/text-generation";
import type { NodeRunner, NodeRunnerContext } from "./types";

export class TextGenerationRunner implements NodeRunner {
	async run(
		node: TextGenerationNodeData,
		context: NodeRunnerContext,
	): Promise<string> {
		const { content } = node;
		const sourceTexts = content.sources.map((source) => {
			const sourceResult = context.dependencies[source.connectedSourceNodeId];
			return String(sourceResult);
		});

		// Here you would implement the actual LLM call
		// For now, we'll just return a mock response
		return `Generated text using ${content.llm} with sources: ${sourceTexts.join(
			", ",
		)}`;
	}

	canHandle(node: TextGenerationNodeData): boolean {
		return isTextGenerationNode(node);
	}
}
