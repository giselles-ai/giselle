import {
	type ActionNode,
	type AppEntryNode,
	type QueryNode,
	type TextGenerationNode,
	type TriggerNode,
	VariableNode,
} from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
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
		const connectedAppEntryInputs: ConnectedOutputWithDetails<AppEntryNode>[] =
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
						case "contentGeneration":
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
						case "appEntry":
							connectedAppEntryInputs.push({
								...output,
								node: node as AppEntryNode,
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
				...connectedAppEntryInputs,
			],
			generation: connectedGeneratedInputs,
			variable: connectedVariableInputs,
			action: connectedActionInputs,
			trigger: connectedTriggerInputs,
			query: connectedQueryInputs,
			appEntry: connectedAppEntryInputs,
		};
	}, [node.id, data.connections, data.nodes]);
}
