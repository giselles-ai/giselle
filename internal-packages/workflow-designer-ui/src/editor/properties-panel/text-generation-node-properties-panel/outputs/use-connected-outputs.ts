import {
	type ActionNode,
	type QueryNode,
	type TextGenerationNode,
	type TriggerNode,
	VariableNode,
} from "@giselle-sdk/data-type";
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
		const connectedActionInputs: ConnectedOutputWithDetails<ActionNode>[] = [];
		const connectedTriggerInputs: ConnectedOutputWithDetails<TriggerNode>[] =
			[];
		const connectedVariableInputs: ConnectedOutputWithDetails<VariableNode>[] =
			[];
		const connectedQueryInputs: ConnectedOutputWithDetails<QueryNode>[] = [];
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
						case "action":
							connectedActionInputs.push({
								...output,
								node: node as ActionNode,
								connection,
							});
							break;
						case "trigger":
							connectedTriggerInputs.push({
								...output,
								node: node as TriggerNode,
								connection,
							});
							break;
						case "imageGeneration":
							break;
						case "query":
							connectedQueryInputs.push({
								...output,
								node: node as QueryNode,
								connection,
							});
							break;
						default: {
							const _exhaustiveCheck: never = node.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				case "variable":
					connectedVariableInputs.push({
						...output,
						node: VariableNode.parse(node),
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
			all: [
				...connectedTriggerInputs,
				...connectedGeneratedInputs,
				...connectedActionInputs,
				...connectedVariableInputs,
				...connectedQueryInputs,
			],
			generation: connectedGeneratedInputs,
			variable: connectedVariableInputs,
			action: connectedActionInputs,
			trigger: connectedTriggerInputs,
			query: connectedQueryInputs,
		};
	}, [node.id, data.connections, data.nodes]);
}
