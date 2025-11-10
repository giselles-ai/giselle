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

	// Find the path to the command object
	const commandPath: (string | number)[] = [];
	let foundCommand = false;

	for (let i = 0; i < issue.path.length; i++) {
		commandPath.push(issue.path[i]);
		if (issue.path[i] === "command") {
			foundCommand = true;
			break;
		}
	}

	if (!foundCommand) {
		return data;
	}

	const command = getValueAtPath(data, commandPath);
	if (!isObject(command)) {
		return data;
	}

	// If provider is missing, add it based on the command structure
	// For GitHub actions, default to "github"
	if (!("provider" in command)) {
		// Check if this looks like a GitHub action (has installationId or repositoryNodeId)
		if (
			"installationId" in command ||
			"repositoryNodeId" in command ||
			"commandId" in command
		) {
			const newData = structuredClone(data as Record<string, unknown>);
			setValueAtPath(newData, [...commandPath, "provider"], "github");
			return newData;
		}
	}

	return data;
}

