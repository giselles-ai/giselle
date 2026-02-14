import type {
	ActionNode,
	AppEntryNode,
	Connection,
	ContentGenerationNode,
	DataQueryNode,
	DataStoreNode,
	NodeBase,
	Output,
	TextGenerationNode,
	TextNode,
	TriggerNode,
} from "@giselles-ai/protocol";
import type { UIConnection } from "@giselles-ai/react";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../../../app-designer";

type ConnectedSource<T extends NodeBase> = {
	output: Output;
	node: T;
	connection: Connection;
};

export function useConnectedSources(node: DataQueryNode) {
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));
	return useMemo(() => {
		const connectionsToThisNode = connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const connectedDataStoreSources: ConnectedSource<DataStoreNode>[] = [];
		const connectedActionSources: ConnectedSource<ActionNode>[] = [];
		const connectedTriggerSources: ConnectedSource<TriggerNode>[] = [];
		const connectedAppEntrySources: ConnectedSource<AppEntryNode>[] = [];
		const connectedGeneratedSources: ConnectedSource<
			TextGenerationNode | ContentGenerationNode
		>[] = [];
		const connectedVariableSources: ConnectedSource<TextNode>[] = [];
		const uiConnections: UIConnection[] = [];

		for (const connection of connectionsToThisNode) {
			const outputNode = nodes.find((n) => n.id === connection.outputNode.id);
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
						default: {
							const _exhaustiveCheck: never = outputNode.content.type;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
					break;
				case "variable":
					switch (outputNode.content.type) {
						case "dataStore":
							// Skip "schema" output - it's only for Text/Image Generation prompts
							if (output.accessor === "schema") {
								continue;
							}
							connectedDataStoreSources.push({
								output,
								node: outputNode as DataStoreNode,
								connection,
							});
							break;
						case "text":
							connectedVariableSources.push({
								output,
								node: outputNode as TextNode,
								connection,
							});
							break;
						case "vectorStore":
						case "github":
						case "file":
						case "webPage":
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

			// Data Store connections are shown as header chips, not as @ mention suggestions
			if (
				outputNode.type === "variable" &&
				outputNode.content.type === "dataStore"
			) {
				continue;
			}

			uiConnections.push({
				id: connection.id,
				output,
				outputNode,
				input,
				inputNode: node,
			});
		}

		return {
			all: [
				...connectedDataStoreSources,
				...connectedGeneratedSources,
				...connectedVariableSources,
				...connectedActionSources,
				...connectedTriggerSources,
				...connectedAppEntrySources,
			],
			dataStore: connectedDataStoreSources,
			generation: connectedGeneratedSources,
			variable: connectedVariableSources,
			action: connectedActionSources,
			trigger: connectedTriggerSources,
			appEntry: connectedAppEntrySources,
			connections: uiConnections,
		};
	}, [connections, node, nodes]);
}
