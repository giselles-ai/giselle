import type { $ZodIssue } from "@zod/core";

import { getValueAtPath, isObject, setValueAtPath } from "../utils";

/**
 * Adds missing `provider` field to `command` objects in action nodes.
 * This migration handles the transition from the old flow package structure
 * to the new action-registry/trigger-registry structure.
 */
export function addProviderToCommand(data: unknown, issue: $ZodIssue) {
	// Only handle invalid_union errors related to command.provider
	if (
		issue.code !== "invalid_union" ||
		!issue.path.includes("command") ||
		!issue.path.includes("provider")
	) {
		return data;
	}

	if (!isObject(data)) {
		return data;
	}

	// Find the path to the command object (before "provider")
	const providerIndex = issue.path.indexOf("provider");
	if (providerIndex === -1) {
		return data;
	}

	const commandPath = issue.path.slice(0, providerIndex);
	const command = getValueAtPath(data, commandPath);
	if (!isObject(command)) {
		return data;
	}

	// If provider is missing or has an invalid value, set it to "github"
	// Since ActionData is a discriminated union with only GitHubActionData,
	// we default to "github" if provider is missing or invalid
	if (!("provider" in command) || command.provider !== "github") {
		const newData = structuredClone(data as Record<string, unknown>);
		setValueAtPath(newData, [...commandPath, "provider"], "github");
		return newData;
	}

	return data;
}

