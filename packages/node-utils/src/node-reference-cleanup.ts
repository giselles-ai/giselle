import type { NodeId } from "@giselle-sdk/data-type";
import {
	findNextNodeReference,
	isJsonContent,
} from "@giselle-sdk/text-editor-utils";

export function cleanupNodeReferencesInJsonContent(
	jsonContent: unknown,
	deletedNodeId: NodeId,
): unknown {
	if (!jsonContent || typeof jsonContent !== "object") {
		return jsonContent;
	}

	const content = jsonContent as Record<string, unknown>;

	// If this is a Source node with the deleted nodeId, remove it
	if (
		content.type === "Source" &&
		typeof content.attrs === "object" &&
		content.attrs !== null
	) {
		const attrs = content.attrs as Record<string, unknown>;
		if (
			attrs.node !== null &&
			typeof attrs.node === "object" &&
			attrs.node !== null
		) {
			const node = attrs.node as Record<string, unknown>;
			if (node.id === deletedNodeId) {
				return null;
			}
		}
	}

	// Recursively process content array
	if (Array.isArray(content.content)) {
		content.content = content.content
			.map((child: unknown) =>
				cleanupNodeReferencesInJsonContent(child, deletedNodeId),
			)
			.filter((child: unknown) => child !== null);
	}

	return content;
}

export function cleanupNodeReferencesInText(
	text: string,
	deletedNodeId: NodeId,
): string {
	// Handle JSON content (rich text from TipTap editor)
	if (isJsonContent(text)) {
		try {
			const jsonContent = JSON.parse(text);
			const cleaned = cleanupNodeReferencesInJsonContent(
				jsonContent,
				deletedNodeId,
			);
			return JSON.stringify(cleaned);
		} catch (error) {
			console.error("Failed to parse JSON content:", error);
		}
	}

	// Handle plain text with {{nodeId:outputId}} references
	let result = text;
	let searchStart = 0;

	while (true) {
		const reference = findNextNodeReference(result, deletedNodeId, searchStart);
		if (!reference) break;

		result =
			result.substring(0, reference.start) + result.substring(reference.end);
		searchStart = reference.start;
	}

	return result;
}
