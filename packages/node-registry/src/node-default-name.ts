import { type ActionProvider, getEntry } from "@giselles-ai/action-registry";
import {
	isActionNode,
	isContentGenerationNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
	type NodeLike,
	type VectorStoreProvider,
} from "@giselles-ai/protocol";
import {
	getEntry as getTriggerEntry,
	type TriggerProvider,
} from "@giselles-ai/trigger-registry";

export function triggerNodeDefaultName(triggerProvider: TriggerProvider) {
	return getTriggerEntry(triggerProvider).label;
}

export function actionNodeDefaultName(actionProvider: ActionProvider) {
	const entry = getEntry(actionProvider);
	if (entry === undefined) {
		return "Unknown action node";
	}
	return entry?.label;
}

export function vectorStoreNodeDefaultName(
	vectorStoreProvider: VectorStoreProvider,
) {
	switch (vectorStoreProvider) {
		case "document":
			return "Document Vector Store";
		case "github":
			return "GitHub Vector Store";
		default:
			throw new Error(
				`Unhandled vector store provider: ${vectorStoreProvider}`,
			);
	}
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
				case "contentGeneration":
					if (!isContentGenerationNode(node)) {
						throw new Error(
							`Expected content generation node, got ${node.type}`,
						);
					}
					return node.name ?? node.content.languageModel.id;
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
				case "appEntry":
					return node.name ?? "App Entry";
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
