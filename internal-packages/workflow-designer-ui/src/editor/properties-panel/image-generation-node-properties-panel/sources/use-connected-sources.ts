import { useWorkflowDesigner } from "@giselles-ai/giselle/react";
import type {
	ActionNode,
	AppEntryNode,
	Connection,
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
import { useMemo } from "react";

type ConnectedSource<T extends NodeBase> = {
	output: Output;
	node: T;
	connection: Connection;
};

export function useConnectedSources(node: ImageGenerationNode) {
	const { data } = useWorkflowDesigner();
	return useMemo(() => {
		const connectionsToThisNode = data.connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);
		const connectedGeneratedTextSources: ConnectedSource<TextGenerationNode>[] =
			[];
		const connectedGeneratedImageSources: ConnectedSource<ImageGenerationNode>[] =
			[];
		const connectedVariableSources: ConnectedSource<VariableNode>[] = [];
		const connectedQuerySources: ConnectedSource<QueryNode>[] = [];
		const connectedTriggerSources: ConnectedSource<TriggerNode>[] = [];
		const connectedActionSources: ConnectedSource<ActionNode>[] = [];
		const connectedAppEntrySources: ConnectedSource<AppEntryNode>[] = [];
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
							connectedGeneratedTextSources.push({
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
						case "trigger":
							connectedTriggerSources.push({
								output,
								node: node as TriggerNode,
								connection,
							});
							break;
						case "imageGeneration":
							connectedGeneratedImageSources.push({
								output,
								node: node as ImageGenerationNode,
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
						case "appEntry":
							connectedAppEntrySources.push({
								output,
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
					switch (node.content.type) {
						case "file":
							connectedVariableSources.push({
								output,
								node: node as FileNode,
								connection,
							});
							break;
						case "text":
							connectedVariableSources.push({
								output,
								node: node as TextNode,
								connection,
							});
							break;
						case "webPage":
							connectedVariableSources.push({
								output,
								node: node as WebPageNode,
								connection,
							});
							break;
						case "vectorStore":
						case "github":
							throw new Error("vectore store can not be connected");
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
				...connectedGeneratedTextSources,
				...connectedVariableSources,
				...connectedQuerySources,
				...connectedGeneratedImageSources,
				...connectedTriggerSources,
				...connectedActionSources,
			],
			generationText: connectedGeneratedTextSources,
			generationImage: connectedGeneratedImageSources,
			variable: connectedVariableSources,
			query: connectedQuerySources,
			trigger: connectedTriggerSources,
			action: connectedActionSources,
		};
	}, [node.id, data.connections, data.nodes]);
}
