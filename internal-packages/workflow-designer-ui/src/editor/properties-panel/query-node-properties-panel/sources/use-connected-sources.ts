import type {
	ActionNode,
	AppEntryNode,
	ContentGenerationNode,
	QueryNode,
	TextGenerationNode,
	TriggerNode,
	VariableNode,
	VectorStoreNode,
} from "@giselles-ai/protocol";
import type { UIConnection } from "@giselles-ai/react";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../../../app-designer";
import type { ConnectedSource, DatastoreNode } from "./types";

export function useConnectedSources(node: QueryNode) {
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));
	return useMemo(() => {
		const connectionsToThisNode = connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const connectedDatastoreSources: ConnectedSource<DatastoreNode>[] = [];
		const connectedActionSources: ConnectedSource<ActionNode>[] = [];
		const connectedTriggerSources: ConnectedSource<TriggerNode>[] = [];
		const connectedAppEntrySources: ConnectedSource<AppEntryNode>[] = [];
		// does not support image generation
		const connectedGeneratedSources: ConnectedSource<
			TextGenerationNode | ContentGenerationNode
		>[] = [];
		const connectedVariableSources: ConnectedSource<VariableNode>[] = [];

		const uiConnections: UIConnection[] = [];
		for (const connection of connectionsToThisNode) {
			const outputNode = nodes.find(
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
			const input = node.inputs.find(
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
				inputNode: node,
			});

			switch (outputNode.type) {
				case "operation":
					switch (outputNode.content.type) {
						case "textGeneration":
							connectedGeneratedSources.push({
								output,
								node: outputNode as TextGenerationNode,
								connection,
							});
							break;
						case "contentGeneration":
							connectedGeneratedSources.push({
								output,
								node: outputNode as ContentGenerationNode,
								connection,
							});
							break;
						case "action":
							connectedActionSources.push({
								output,
								node: outputNode as ActionNode,
								connection,
							});
							break;
						case "trigger":
							connectedTriggerSources.push({
								output,
								node: outputNode as TriggerNode,
								connection,
							});
							break;
						case "appEntry":
							connectedAppEntrySources.push({
								output,
								node: outputNode as AppEntryNode,
								connection,
							});
							break;
						case "imageGeneration":
						case "query":
						case "dataQuery":
							break;
						case "end":
							// End Node has no Output so do nothing
							break;
						case "dataQuery":
							// TODO: implement dataQuery
							break;
						default: {
							const _exhaustiveCheck: never = outputNode.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				case "variable":
					switch (outputNode.content.type) {
						case "vectorStore":
							connectedDatastoreSources.push({
								output,
								node: outputNode as VectorStoreNode,
								connection,
							});
							break;
						case "github":
						case "text":
							connectedVariableSources.push({
								output,
								node: outputNode as VariableNode,
								connection,
							});
							break;
						case "file":
						case "webPage":
						case "dataStore":
							break;
						case "dataStore":
							// TODO: implement dataStore
							break;
						default: {
							const _exhaustiveCheck: never = outputNode.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				default: {
					const _exhaustiveCheck: never = outputNode;
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
			connections: uiConnections,
		};
	}, [connections, node, nodes]);
}
