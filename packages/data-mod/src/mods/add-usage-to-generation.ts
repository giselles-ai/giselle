import type { ZodIssue } from "zod";
import { getValueAtPath, isObject, setValueAtPath } from "../utils";

/**
 * Adds a default usage field to Generation objects when missing
 * This handles the schema change where usage field was added to Generation
 * When adding usage via this mod, default values are assigned based on
 * the generation status and length of messages
 */
export function addUsageToGeneration(data: unknown, issue: ZodIssue) {
	// Check if this is an issue related to a missing required usage field
	if (
		!(
			issue.code === "invalid_type" &&
			issue.expected === "object" &&
			issue.received === "undefined" &&
			issue.path[issue.path.length - 1] === "usage"
		)
	) {
		return data;
	}

	if (!isObject(data)) {
		return data;
	}

	// Get the generation object path
	const generationPath = issue.path.slice(0, -1);
	const generation = getValueAtPath(data, generationPath);

	// Ensure this is a generation object
	if (!generation || typeof generation !== "object") {
		return data;
	}

	// Clone the data to avoid mutating the original
	const newData = { ...data };

	// Generate default token usage based on messages length
	// This is a simplistic estimation - in real scenarios you would
	// want to use actual token counts from the API response
	const messages = Array.isArray(generation.messages)
		? generation.messages
		: [];
	const promptTokens = messages.length > 0 ? messages.length * 100 : 0;
	const completionTokens =
		generation.status === "completed"
			? messages.length * 200
			: generation.status === "running"
				? messages.length * 100
				: 0;
	const totalTokens = promptTokens + completionTokens;

	// Set default usage
	const usage = {
		promptTokens,
		completionTokens,
		totalTokens,
	};

	// Set the usage in the generation
	setValueAtPath(newData, [...generationPath, "usage"], usage);

	return newData;
}
