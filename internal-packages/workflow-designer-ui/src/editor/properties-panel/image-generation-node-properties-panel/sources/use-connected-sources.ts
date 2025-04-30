import type {
	ImageGenerationNode,
	TextGenerationNode,
	VariableNode,
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
		const connectedVariableSources: ConnectedSource<VariableNode>[] = [];
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
					}
					break;
				case "variable":
					connectedVariableSources.push({
						output,
						node,
						connection,
					});
					break;
				default: {
					const _exhaustiveCheck: never = node;
					throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
				}
			}
		}

		return {
			all: [...connectedGeneratedSources, ...connectedVariableSources],
			generation: connectedGeneratedSources,
			variable: connectedVariableSources,
		};
	}, [node.id, data.connections, data.nodes]);
}
