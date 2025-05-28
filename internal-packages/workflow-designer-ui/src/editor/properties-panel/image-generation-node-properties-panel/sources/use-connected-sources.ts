import type {
	ImageGenerationNode,
	QueryNode,
	TextGenerationNode,
	VariableNodeLike,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import type { ConnectedSource } from "./types";

export function useConnectedSources(node: ImageGenerationNode) {
	const { data } = useWorkflowDesigner();
	return useMemo(() => {
		const connectionsToThisNode = data.connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);
		const connectedGeneratedSources: ConnectedSource<TextGenerationNode>[] = [];
		const connectedVariableSources: ConnectedSource<VariableNodeLike>[] = [];
		const connectedQuerySources: ConnectedSource<QueryNode>[] = [];
		for (const connection of connectionsToThisNode) {
			const node = data.nodes.find(
				(node) => node.id === connection.outputNode.id,
			);
			if (node === undefined) {
				continue;
			}
			const output = node.outputs.find(
				(output) => output.id === connection.outputId,
			);
			if (output === undefined) {
				continue;
			}

			switch (node.type) {
				case "operation":
					switch (node.content.type) {
						case "textGeneration":
							connectedGeneratedSources.push({
								output,
								node: node as TextGenerationNode,
								connection,
							});
							break;
						case "query":
							connectedQuerySources.push({
								output,
								node: node as QueryNode,
								connection,
							});
							break;
						case "imageGeneration":
						case "action":
						case "trigger":
							throw new Error("not implemented");
						default: {
							const _exhaustiveCheck: never = node.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				case "variable":
					switch (node.content.type) {
						case "text":
							connectedVariableSources.push({
								output,
								node,
								connection,
							});
							break;

						case "file":
						case "github":
						case "vectorStore":
							throw new Error("not implemented");
						default: {
							const _exhaustiveCheck: never = node.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				default: {
					const _exhaustiveCheck: never = node;
					throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
				}
			}
		}

		return {
			all: [
				...connectedGeneratedSources,
				...connectedVariableSources,
				...connectedQuerySources,
			],
			generation: connectedGeneratedSources,
			variable: connectedVariableSources,
			query: connectedQuerySources,
		};
	}, [node.id, data.connections, data.nodes]);
}
