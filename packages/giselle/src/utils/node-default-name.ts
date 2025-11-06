import { type ActionProvider, getEntry } from "@giselles-ai/action-registry";
import {
	isActionNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
	type NodeLike,
} from "@giselles-ai/protocol";
import type { TriggerProvider } from "../engine";
import type { VectorStoreSourceProvider } from "../engine/vector-store";

export const triggerProviderLabel: Record<TriggerProvider, string> = {
	github: "GitHub Trigger",
	manual: "Manual Trigger",
	"app-entry": "App Entry",
};

export function triggerNodeDefaultName(triggerProvider: TriggerProvider) {
	return triggerProviderLabel[triggerProvider];
}

export function actionNodeDefaultName(actionProvider: ActionProvider) {
	const entry = getEntry(actionProvider);
	if (entry === undefined) {
		return "Unknown action node";
	}
	return entry?.label;
}

export const vectorStoreProviderLabel: Record<
	VectorStoreSourceProvider,
	string
> = {
	github: "GitHub Vector Store",
	document: "Document Vector Store",
};
export function vectorStoreNodeDefaultName(
	vectorStoreProvider: VectorStoreSourceProvider,
) {
	return vectorStoreProviderLabel[vectorStoreProvider];
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
