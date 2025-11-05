import type { Generation } from "@giselle-ai/giselle";
import {
	isImageGenerationNode,
	isTextGenerationNode,
} from "@giselle-ai/protocol";

/**
 * Extract model information from generation data
 */
export function getModelInfo(generation: Generation | undefined): {
	provider: string;
	modelName: string;
} {
	if (!generation) {
		return { provider: "Unknown", modelName: "Unknown" };
	}

	try {
		const operationNode = generation.context.operationNode;
		if (
			operationNode &&
			(isTextGenerationNode(operationNode) ||
				isImageGenerationNode(operationNode))
		) {
			const provider = operationNode.content.llm.provider;
			const modelName = operationNode.content.llm.id || provider;
			return { provider, modelName };
		}
	} catch (_error) {
		// If we can't access the operation node, fall back to defaults
	}
	return { provider: "Unknown", modelName: "Unknown" };
}

/**
 * Map act status to StatusBadge status
 */
export function getStatusBadgeStatus(actStatus: string) {
	switch (actStatus?.toLowerCase()) {
		case "completed":
		case "success":
			return "success";
		case "failed":
		case "error":
			return "error";
		case "running":
		case "processing":
			return "info";
		case "queued":
		case "pending":
			return "warning";
		case "cancelled":
		case "ignored":
			return "ignored";
		default:
			return "info";
	}
}

/**
 * Format execution date for display
 */
export function formatExecutionDate(dateString: string | number): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}
