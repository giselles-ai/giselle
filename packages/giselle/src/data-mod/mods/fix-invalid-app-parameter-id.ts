import { AppParameterId } from "@giselles-ai/protocol";
import type { $ZodIssue } from "@zod/core";
import { getValueAtPath, isObject, setValueAtPath } from "../utils";

function isDraftAppParameterIdIssue(issue: $ZodIssue): boolean {
	if (issue.code !== "invalid_format" || issue.format !== "regex") {
		return false;
	}

	// Expected shape:
	// ["content", "draftApp", "parameters", <index>, "id"]
	// or ["draftApp", "parameters", <index>, "id"]
	const path = issue.path;
	for (let i = 0; i <= path.length - 4; i += 1) {
		if (
			path[i] === "draftApp" &&
			path[i + 1] === "parameters" &&
			typeof path[i + 2] === "number" &&
			path[i + 3] === "id"
		) {
			return true;
		}
	}
	return false;
}

/**
 * Repairs invalid `appprm-*` ids found in `draftApp.parameters[*].id`.
 * This prevents runtime ZodError loops when loading older/broken workspace JSON.
 */
export function fixInvalidAppParameterId(data: unknown, issue: $ZodIssue) {
	if (!isObject(data)) {
		return data;
	}
	if (!isDraftAppParameterIdIssue(issue)) {
		return data;
	}

	const currentValue = getValueAtPath(data, issue.path as PropertyKey[]);
	if (typeof currentValue !== "string") {
		return data;
	}
	if (AppParameterId.schema.safeParse(currentValue).success) {
		return data;
	}

	const nextData = structuredClone(data);
	setValueAtPath(
		nextData,
		issue.path as PropertyKey[],
		AppParameterId.generate(),
	);
	return nextData;
}
