import type { NodeId, OutputId } from "@giselle-sdk/data-type";
import {
	findNextNodeReference,
	formatNodeReference,
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

/**
 * Clean up specific node reference (nodeId:outputId) from JSON content
 */
export function cleanupSpecificNodeReferenceInJsonContent(
	jsonContent: unknown,
	nodeId: NodeId,
	outputId: OutputId,
): unknown {
	if (!jsonContent || typeof jsonContent !== "object") {
		return jsonContent;
	}

	const content = jsonContent as Record<string, unknown>;

	// If this is a Source node with the specific nodeId and outputId, remove it
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
			if (node.id === nodeId && attrs.outputId === outputId) {
				return null;
			}
		}
	}

	// Recursively process content array
	if (Array.isArray(content.content)) {
		content.content = content.content
			.map((child: unknown) =>
				cleanupSpecificNodeReferenceInJsonContent(child, nodeId, outputId),
			)
			.filter((child: unknown) => child !== null);
	}

	// Remove empty paragraph nodes
	if (content.type === "paragraph" && Array.isArray(content.content)) {
		if (content.content.length === 0) {
			return null;
		}
		// Check if paragraph only contains empty text nodes
		const hasOnlyEmptyText = content.content.every((child: unknown) => {
			if (typeof child === "object" && child !== null) {
				const textNode = child as Record<string, unknown>;
				return (
					textNode.type === "text" &&
					(textNode.text === "" || textNode.text === " ")
				);
			}
			return false;
		});
		if (hasOnlyEmptyText) {
			return null;
		}
	}

	return content;
}

/**
 * Clean up specific node reference (nodeId:outputId) from text
 */
export function cleanupSpecificNodeReferenceInText(
	text: string,
	nodeId: NodeId,
	outputId: OutputId,
): string {
	// Handle JSON content (rich text from TipTap editor)
	if (isJsonContent(text)) {
		try {
			const jsonContent = JSON.parse(text);
			const cleaned = cleanupSpecificNodeReferenceInJsonContent(
				jsonContent,
				nodeId,
				outputId,
			);
			return JSON.stringify(cleaned);
		} catch (error) {
			console.error("Failed to parse JSON content:", error);
		}
	}

	// Handle plain text with specific {{nodeId:outputId}} reference
	const targetReference = formatNodeReference(nodeId, outputId);
	let result = text;
	let searchStart = 0;

	while (true) {
		const startIndex = result.indexOf(targetReference, searchStart);
		if (startIndex === -1) break;

		const endIndex = startIndex + targetReference.length;
		result = result.substring(0, startIndex) + result.substring(endIndex);
		searchStart = startIndex;
	}

	return result;
}
