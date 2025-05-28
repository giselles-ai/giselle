import {
	type NodeLike,
	isActionNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
} from "@giselle-sdk/data-type";
import type { ActionProvider, TriggerProvider } from "@giselle-sdk/flow";
import type { VectorStoreSourceProvider } from "@giselle-sdk/vector-store";

export const triggerProviderLabel: Record<TriggerProvider, string> = {
	github: "GitHub",
	manual: "Manual",
};

export function triggerNodeDefaultName(triggerProvider: TriggerProvider) {
	return `${triggerProviderLabel[triggerProvider]} Trigger`;
}

export const actionProviderLabel: Record<ActionProvider, string> = {
	github: "GitHub",
};

export function actionNodeDefaultName(triggerProvider: ActionProvider) {
	return `${triggerProviderLabel[triggerProvider]} Action`;
}

export const vectorStoreProviderLabel: Record<
	VectorStoreSourceProvider,
	string
> = {
	github: "GitHub",
};
export function vectorStoreNodeDefaultName(
	vectorStoreProvider: VectorStoreSourceProvider,
) {
	return `${vectorStoreProviderLabel[vectorStoreProvider]} Vector Store`;
}

export function defaultName(node: NodeLike) {
	switch (node.type) {
		case "operation":
			switch (node.content.type) {
				case "textGeneration":
					if (!isTextGenerationNode(node)) {
						throw new Error(`Expected text generation node, got ${node.type}`);
					}
					return node.name ?? node.content.llm.id;
				case "imageGeneration":
					if (!isImageGenerationNode(node)) {
						throw new Error(`Expected image generation node, got ${node.type}`);
					}
					return node.name ?? node.content.llm.id;
				case "trigger":
					if (!isTriggerNode(node)) {
						throw new Error(
							`Expected trigger node, got ${JSON.stringify(node)}`,
						);
					}
					return node.name ?? triggerNodeDefaultName(node.content.provider);
				case "action":
					if (!isActionNode(node)) {
						throw new Error(`Expected action node, got ${node.type}`);
					}
					return (
						node.name ?? actionNodeDefaultName(node.content.command.provider)
					);
				case "query":
					if (!isQueryNode(node)) {
						throw new Error(`Expected query node, got ${node.type}`);
					}
					return node.name ?? "Query";
				default: {
					const _exhaustiveCheck: never = node.content.type;
					throw new Error(`Unhandled action content type: ${_exhaustiveCheck}`);
				}
			}
		case "variable":
			switch (node.content.type) {
				case "vectorStore":
					if (!isVectorStoreNode(node)) {
						throw new Error(
							`Expected vector store node, got ${JSON.stringify(node)}`,
						);
					}
					return (
						node.name ??
						vectorStoreNodeDefaultName(node.content.source.provider)
					);
				default:
					return node.name ?? node.content.type;
			}
		default: {
			const _exhaustiveCheck: never = node;
			throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
		}
	}
}
