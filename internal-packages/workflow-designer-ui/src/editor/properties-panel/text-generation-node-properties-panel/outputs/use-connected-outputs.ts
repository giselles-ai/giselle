import type { TextGenerationNode, VariableNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import type { ConnectedOutputWithDetails } from "./types";

export function useConnectedOutputs(node: TextGenerationNode) {
	const { data } = useWorkflowDesigner();
	return useMemo(() => {
		const connectionsToThisNode = data.connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);
		const connectedGeneratedInputs: ConnectedOutputWithDetails<TextGenerationNode>[] =
			[];
		const connectedVariableInputs: ConnectedOutputWithDetails<VariableNode>[] =
			[];
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
							connectedGeneratedInputs.push({
								...output,
								node: node as TextGenerationNode,
								connection,
							});
							break;
					}
					break;
				case "variable":
					connectedVariableInputs.push({
						...output,
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
			all: [...connectedGeneratedInputs, ...connectedVariableInputs],
			generation: connectedGeneratedInputs,
			variable: connectedVariableInputs,
		};
	}, [node.id, data.connections, data.nodes]);
}
