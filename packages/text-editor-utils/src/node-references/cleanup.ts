import type { NodeId, OutputId } from "@giselle-sdk/data-type";
import type { JSONContent } from "@tiptap/core";
import type { SourceJSONContent } from "../extensions/source-extension";
import { isJsonContent } from "../is-json-content";
import { findNextNodeReference, formatNodeReference } from "./formatting";

/**
 * Type guard to check if jsonContent is a Source
 */
function isSourceContent(
	jsonContent: JSONContent,
): jsonContent is SourceJSONContent {
	return (
		jsonContent.type === "Source" &&
		typeof jsonContent.attrs === "object" &&
		jsonContent.attrs !== null &&
		"node" in jsonContent.attrs &&
		typeof jsonContent.attrs.node === "object" &&
		jsonContent.attrs.node !== null &&
		"id" in jsonContent.attrs.node &&
		"outputId" in jsonContent.attrs
	);
}

/**
 * Type guard to check if jsonContent is a paragraph
 */
function isParagraphContent(
	jsonContent: JSONContent,
): jsonContent is JSONContent & {
	type: "paragraph";
	content?: JSONContent[];
} {
	return jsonContent.type === "paragraph";
}

/**
 * Type guard to check if jsonContent is a text
 */
function isTextContent(jsonContent: JSONContent): jsonContent is JSONContent & {
	type: "text";
	text: string;
} {
	return jsonContent.type === "text" && typeof jsonContent.text === "string";
}

/**
 * Helper function to process content arrays while maintaining immutability
 */
function processContentArray(
	jsonContent: JSONContent,
	processor: (child: JSONContent) => JSONContent | null,
): JSONContent {
	if (!jsonContent.content || !Array.isArray(jsonContent.content)) {
		return jsonContent;
	}

	const processedContent = jsonContent.content
		.map(processor)
		.filter((child): child is JSONContent => child !== null);

	// Return a new object with all properties copied and the new content array
	return {
		...jsonContent,
		content: processedContent,
	};
}

function cleanupNodeReferencesInJsonContent(
	jsonContent: unknown,
	deletedNodeId: NodeId,
): JSONContent | null {
	if (!isJsonContent(jsonContent)) {
		return null;
	}

	// If this is a Source with the deleted nodeId, remove it
	if (isSourceContent(jsonContent)) {
		if (jsonContent.attrs.node.id === deletedNodeId) {
			return null;
		}
	}

	// Recursively process content array
	return processContentArray(jsonContent, (child) =>
		cleanupNodeReferencesInJsonContent(child, deletedNodeId),
	);
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
			// Return empty paragraph if cleaned is null to maintain valid TipTap structure
			if (cleaned === null) {
				return JSON.stringify({ type: "paragraph", content: [] });
			}
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
function cleanupSpecificNodeReferenceInJsonContent(
	jsonContent: unknown,
	nodeId: NodeId,
	outputId: OutputId,
): JSONContent | null {
	if (!isJsonContent(jsonContent)) {
		return null;
	}

	// If this is a Source with the specific nodeId and outputId, remove it
	if (isSourceContent(jsonContent)) {
		if (
			jsonContent.attrs.node.id === nodeId &&
			jsonContent.attrs.outputId === outputId
		) {
			return null;
		}
	}

	// Recursively process content array
	const processedContent = processContentArray(jsonContent, (child) =>
		cleanupSpecificNodeReferenceInJsonContent(child, nodeId, outputId),
	);

	// Remove empty paragraph nodes
	if (isParagraphContent(processedContent)) {
		if (!processedContent.content || processedContent.content.length === 0) {
			return null;
		}
		// Check if paragraph only contains empty text nodes
		const hasOnlyEmptyText = processedContent.content.every((child) => {
			if (isTextContent(child)) {
				return child.text === "" || child.text === " ";
			}
			return false;
		});
		if (hasOnlyEmptyText) {
			return null;
		}
	}

	return processedContent;
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
			// Return empty paragraph if cleaned is null to maintain valid TipTap structure
			if (cleaned === null) {
				return JSON.stringify({ type: "paragraph", content: [] });
			}
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
