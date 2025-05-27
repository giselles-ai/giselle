import type { $ZodIssue } from "@zod/core";
import { getValueAtPath, isObject, setValueAtPath } from "../utils";

/**
 * Adds workspaceId to GenerationOriginRun objects when missing
 * This handles the schema change where workspaceId was added to GenerationOriginRun
 * When adding workspaceId via this mod, we use a fixed value "wrks-9999999999999999"
 * to make it clear the ID was automatically added by the data-mod system
 */
export function addWorkspaceIdToOriginRun(data: unknown, issue: $ZodIssue) {
	// Check if this is an issue with a missing required workspaceId field in an origin object
	const pathLen = issue.path.length;
	if (
		pathLen < 2 ||
		issue.path[pathLen - 1] !== "workspaceId" ||
		issue.path[pathLen - 2] !== "origin"
	) {
		return data;
	}

	if (!isObject(data)) {
		return data;
	}

	// Get the origin object
	const originPath = issue.path.slice(0, -1);
	const origin = getValueAtPath(data, originPath);

	// Verify this is a run type origin
	if (!origin || typeof origin !== "object" || origin.type !== "run") {
		return data;
	}

	// Clone the data to avoid mutating the original
	const newData = { ...data };

	// Get workspace ID from context if available
	let workspaceId: string | undefined;
	const contextPath = issue.path.slice(0, issue.path.indexOf("origin") - 1);
	const context = getValueAtPath(data, contextPath);

	if (context && typeof context === "object") {
		// Try to find workspaceId in other parts of the context
		if (
			context.origin &&
			typeof context.origin === "object" &&
			context.origin.id
		) {
			// If origin.type is "workspace", use that ID
			if (context.origin.type === "workspace") {
				workspaceId = context.origin.id;
			}
		}
	}

	// If we couldn't find the workspaceId, use a fixed placeholder value
	// This makes it clear the ID was automatically added by the data-mod system
	if (!workspaceId) {
		workspaceId = "wrks-9999999999999999";
	}

	// Set the workspaceId in the origin
	setValueAtPath(newData, [...originPath, "workspaceId"], workspaceId);

	return newData;
}
