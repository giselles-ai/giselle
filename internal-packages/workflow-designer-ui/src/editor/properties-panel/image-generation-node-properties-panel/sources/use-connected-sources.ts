import type {
	ActionNode,
	AppEntryNode,
	Connection,
	ContentGenerationNode,
	DataQueryNode,
	DataStoreNode,
	FileNode,
	ImageGenerationNode,
	NodeBase,
	Output,
	QueryNode,
	TextGenerationNode,
	TextNode,
	TriggerNode,
	VariableNode,
	WebPageNode,
} from "@giselles-ai/protocol";
import type { UIConnection } from "@giselles-ai/react";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../../../app-designer";

type ConnectedSource<T extends NodeBase> = {
	output: Output;
	node: T;
	connection: Connection;
};

export function useConnectedSources(node: ImageGenerationNode) {
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));
	return useMemo(() => {
		const connectionsToThisNode = connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);
		const connectedGeneratedTextSources: ConnectedSource<
			TextGenerationNode | ContentGenerationNode
		>[] = [];
		const connectedGeneratedImageSources: ConnectedSource<ImageGenerationNode>[] =
			[];
		const connectedVariableSources: ConnectedSource<VariableNode>[] = [];
		const connectedQuerySources: ConnectedSource<QueryNode>[] = [];
		const connectedDataQuerySources: ConnectedSource<DataQueryNode>[] = [];
		const connectedTriggerSources: ConnectedSource<TriggerNode>[] = [];
		const connectedActionSources: ConnectedSource<ActionNode>[] = [];
		const connectedAppEntrySources: ConnectedSource<AppEntryNode>[] = [];
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

			switch (outputNode.type) {
				case "operation":
					switch (outputNode.content.type) {
						case "textGeneration":
							connectedGeneratedTextSources.push({
								output,
								node: outputNode as TextGenerationNode,
								connection,
							});
							break;
						case "contentGeneration":
							connectedGeneratedTextSources.push({
								output,
								node: outputNode as ContentGenerationNode,
								connection,
							});
							break;
						case "query":
							connectedQuerySources.push({
								output,
								node: outputNode as QueryNode,
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
						case "imageGeneration":
							connectedGeneratedImageSources.push({
								output,
								node: outputNode as ImageGenerationNode,
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
						case "appEntry":
							connectedAppEntrySources.push({
								output,
								node: outputNode as AppEntryNode,
								connection,
							});
							break;
						case "end":
							// End Node have no Output here
							break;
						case "dataQuery":
							connectedDataQuerySources.push({
								output,
								node: outputNode as DataQueryNode,
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
					switch (outputNode.content.type) {
						case "file":
							connectedVariableSources.push({
								output,
								node: outputNode as FileNode,
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
						case "webPage":
							connectedVariableSources.push({
								output,
								node: outputNode as WebPageNode,
								connection,
							});
							break;
						case "vectorStore":
						case "github":
							throw new Error("vectore store can not be connected");
						case "dataStore":
							// Skip Data Store "source" output - it's only for Data Query connections
							if (output.accessor === "source") {
								continue;
							}
							connectedVariableSources.push({
								output,
								node: outputNode as DataStoreNode,
								connection,
							});
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
				...connectedGeneratedTextSources,
				...connectedVariableSources,
				...connectedQuerySources,
				...connectedDataQuerySources,
				...connectedGeneratedImageSources,
				...connectedTriggerSources,
				...connectedActionSources,
			],
			generationText: connectedGeneratedTextSources,
			generationImage: connectedGeneratedImageSources,
			variable: connectedVariableSources,
			query: connectedQuerySources,
			dataQuery: connectedDataQuerySources,
			trigger: connectedTriggerSources,
			action: connectedActionSources,
			connections: uiConnections,
		};
	}, [connections, node, nodes]);
}
