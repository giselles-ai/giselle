import type { Node } from "@giselle-sdk/data-type";
import type { ActionProvider, TriggerProvider } from "@giselle-sdk/flow";

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
	return `${actionProviderLabel[triggerProvider]} Action`;
}

export function defaultName(node: Node) {
	switch (node.type) {
		case "operation":
			switch (node.content.type) {
				case "textGeneration":
				case "imageGeneration":
					return node.name ?? node.content.llm.id;
				case "trigger":
					return node.name ?? triggerNodeDefaultName(node.content.provider);
				case "action":
					return (
						node.name ?? actionNodeDefaultName(node.content.command.provider)
					);
				default: {
					const _exhaustiveCheck: never = node.content;
					throw new Error(`Unhandled action content type: ${_exhaustiveCheck}`);
				}
			}
		case "variable":
			return node.name ?? node.content.type;
		default: {
			const _exhaustiveCheck: never = node;
			throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
		}
	}
}
