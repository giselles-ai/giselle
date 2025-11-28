import {
	type ActionNode,
	type AppEntryNode,
	type QueryNode,
	type TextGenerationNode,
	type TriggerNode,
	VariableNode,
} from "@giselles-ai/protocol";
import { type UIConnection, useWorkflowDesigner } from "@giselles-ai/react";
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

		const uiConnections: UIConnection[] = [];

		for (const connection of connectionsToThisNode) {
			const outputNode = data.nodes.find(
				(node) => node.id === connection.outputNode.id,
			);
			if (outputNode === undefined) {
				continue;
			}
			const output = outputNode.outputs.find(
				(output) => output.id === connection.outputId,
			);
			if (output === undefined) {
				continue;
			}
			const inputNode = data.nodes.find(
				(node) => node.id === connection.inputNode.id,
			);
			if (inputNode === undefined) {
				continue;
			}
			const input = inputNode.inputs.find(
				(input) => input.id === connection.inputId,
			);
			if (input === undefined) {
				continue;
			}
			uiConnections.push({
				id: connection.id,
				output,
				outputNode,
				input,
				inputNode,
			});

			switch (outputNode.type) {
				case "operation":
					switch (outputNode.content.type) {
						case "textGeneration":
						case "contentGeneration":
							connectedGeneratedInputs.push({
								...output,
								node: outputNode as TextGenerationNode,
								connection,
							});
							break;
						case "action":
							connectedActionInputs.push({
								...output,
								node: outputNode as ActionNode,
								connection,
							});
							break;
						case "trigger":
							connectedTriggerInputs.push({
								...output,
								node: outputNode as TriggerNode,
								connection,
							});
							break;
						case "imageGeneration":
							break;
						case "query":
							connectedQueryInputs.push({
								...output,
								node: outputNode as QueryNode,
								connection,
							});
							break;
						case "appEntry":
							connectedAppEntryInputs.push({
								...output,
								node: outputNode as AppEntryNode,
								connection,
							});
							break;
						default: {
							const _exhaustiveCheck: never = outputNode.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				case "variable":
					connectedVariableInputs.push({
						...output,
						node: VariableNode.parse(outputNode),
						connection,
					});
					break;
				default: {
					const _exhaustiveCheck: never = outputNode;
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
			connections: uiConnections,
		};
	}, [node.id, data.connections, data.nodes]);
}
