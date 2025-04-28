import type { Node } from "@giselle-sdk/data-type";

export function defaultName(node: Node) {
	switch (node.type) {
		case "action":
			switch (node.content.type) {
				case "textGeneration":
				case "imageGeneration":
					return node.name ?? node.content.llm.id;
				case "trigger":
					return node.name ?? node.content.provider.type;
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
