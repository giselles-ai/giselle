import type { NodeId, OutputId } from "@giselle-sdk/data-type";

/**
 * Get node reference prefix {{nodeId:
 */
function getNodeReferencePrefix(nodeId: NodeId): string {
	return `{{${nodeId}:`;
}

/**
 * Format node reference to {{nodeId:outputId}} format
 */
export function formatNodeReference(
	nodeId: NodeId,
	outputId: OutputId,
): string {
	return `${getNodeReferencePrefix(nodeId)}${outputId}}}`;
}

/**
 * Check if text contains reference to specific node
 */
export function containsNodeReference(text: string, nodeId: NodeId): boolean {
	return text.includes(getNodeReferencePrefix(nodeId));
}

/**
 * Check if text contains specific node reference (nodeId:outputId)
 */
export function containsSpecificNodeReference(text: string, nodeId: NodeId, outputId: OutputId): boolean {
	return text.includes(formatNodeReference(nodeId, outputId));
}

/**
 * Find next node reference for a specific nodeId
 * Returns the start and end indices, or null if not found
 */
export function findNextNodeReference(
	text: string,
	nodeId: NodeId,
	startFrom = 0,
): { start: number; end: number } | null {
	const prefix = getNodeReferencePrefix(nodeId);
	const startIndex = text.indexOf(prefix, startFrom);
	if (startIndex === -1) return null;

	const endIndex = text.indexOf("}}", startIndex);
	if (endIndex === -1) return null;

	return {
		start: startIndex,
		end: endIndex + 2,
	};
}
