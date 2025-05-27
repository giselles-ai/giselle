import type {
	ActionNode,
	QueryNode,
	TextGenerationNode,
	TriggerNode,
	VariableNode,
	VectorStoreNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import type { ConnectedSource, DatastoreNode } from "./types";

export function useConnectedSources(node: QueryNode) {
	const { data } = useWorkflowDesigner();
	return useMemo(() => {
		const connectionsToThisNode = data.connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const connectedDatastoreSources: ConnectedSource<DatastoreNode>[] = [];
		const connectedActionSources: ConnectedSource<ActionNode>[] = [];
		const connectedTriggerSources: ConnectedSource<TriggerNode>[] = [];
		// does not support image generation
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
						case "action":
							connectedActionSources.push({
								output,
								node: node as ActionNode,
								connection,
							});
							break;
						case "trigger":
							connectedTriggerSources.push({
								output,
								node: node as TriggerNode,
								connection,
							});
							break;
						case "imageGeneration":
						case "query":
							break;
						default: {
							const _exhaustiveCheck: never = node.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				case "variable":
					switch (node.content.type) {
						case "vectorStore":
							connectedDatastoreSources.push({
								output,
								node: node as VectorStoreNode,
								connection,
							});
							break;
						case "github":
						case "text":
							connectedVariableSources.push({
								output,
								node: node as VariableNode,
								connection,
							});
							break;
						case "file":
							break;
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
				...connectedDatastoreSources,
				...connectedGeneratedSources,
				...connectedVariableSources,
				...connectedActionSources,
				...connectedTriggerSources,
			],
			datastore: connectedDatastoreSources,
			generation: connectedGeneratedSources,
			variable: connectedVariableSources,
			action: connectedActionSources,
			trigger: connectedTriggerSources,
		};
	}, [node.id, data.connections, data.nodes]);
}
