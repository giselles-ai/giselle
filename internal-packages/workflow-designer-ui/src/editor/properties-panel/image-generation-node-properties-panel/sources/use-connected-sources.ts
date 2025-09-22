import type {
	FileNode,
	ImageGenerationNode,
	QueryNode,
	TextGenerationNode,
	TextNode,
	VariableNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useMemo } from "react";
import type { ConnectedSource } from "./types";

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
						case "imageGeneration":
							connectedGeneratedImageSources.push({
								output,
								node: node as ImageGenerationNode,
								connection,
							});
							break;
						case "action":
						case "trigger":
							throw new Error("not implemented");
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

						case "vectorStore":
						case "webPage":
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
			],
			generationText: connectedGeneratedTextSources,
			generationImage: connectedGeneratedImageSources,
			variable: connectedVariableSources,
			query: connectedQuerySources,
		};
	}, [node.id, data.connections, data.nodes]);
}
