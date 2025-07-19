import type { $ZodIssue } from "@zod/core";

import { getValueAtPath, isObject, setValueAtPath } from "../utils";

/**
 * Deep transforms all instances of "action" to "operation" in node types
 */
function transformNodeTypes(obj: unknown): unknown {
	if (!obj || typeof obj !== "object") {
		return obj;
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => transformNodeTypes(item));
	}

	// Clone the object to avoid modifying original
	// biome-ignore lint/suspicious/noExplicitAny: Using any for generic deep copying
	const result = { ...(obj as Record<string, any>) };

	// Process all properties first, to handle nested structures
	for (const key in result) {
		if (key !== "actionNode" && key !== "actions") {
			// Skip these for special handling
			result[key] = transformNodeTypes(result[key]);
		}
	}

	// If this is a node with type "action", change to "operation"
	if (
		"type" in result &&
		result.type === "action" &&
		("content" in result || // Regular node
			"id" in result) // Node reference
	) {
		result.type = "operation";
	}

	// If this has an actionNode field, rename to operationNode
	if ("actionNode" in result) {
		// Transform the actionNode contents first
		const transformedActionNode = transformNodeTypes(result.actionNode);
		// Then assign it to operationNode
		result.operationNode = transformedActionNode;
	}

	// If this has an actions array, rename to operations (legacy) or steps (current)
	if ("actions" in result && Array.isArray(result.actions)) {
		// Transform to operations for backward compatibility
		result.operations = result.actions.map((action) =>
			transformNodeTypes(action),
		);
		// Also create steps for new format
		result.steps = result.actions.map((action) => transformNodeTypes(action));
	}

	// If this has a jobs array, also create sequences for new format
	if ("jobs" in result && Array.isArray(result.jobs)) {
		result.sequences = result.jobs.map((job: unknown) =>
			transformNodeTypes(job),
		);
	}

	return result;
}

export function renameActionToOperation(data: unknown, issue: $ZodIssue) {
	// Skip if not a relevant issue
	if (!isObject(data)) {
		return data;
	}

	if (issue.code === "invalid_type" && issue.expected === "string") {
		return data;
	}

	// For missing operationNode in generationTemplate (required field missing)
	if (
		issue.code === "invalid_type" &&
		issue.expected === "object" &&
		issue.path.includes("operationNode")
	) {
		// biome-ignore lint/suspicious/noExplicitAny: Using any for generic deep copying
		const newData = structuredClone(data as Record<string, any>);

		// Find the generationTemplate parent path
		const templatePathIndex = issue.path.indexOf("generationTemplate");
		if (templatePathIndex >= 0) {
			const templatePath = issue.path.slice(0, templatePathIndex + 1);
			const template = getValueAtPath(data, templatePath);
			// If template exists
			if (template && typeof template === "object") {
				// First check if the template has an actionNode (old naming)
				if ("actionNode" in template) {
					// Transform and move actionNode to operationNode
					const transformedNode = transformNodeTypes(template.actionNode);
					setValueAtPath(
						newData,
						[...templatePath, "operationNode"],
						transformedNode,
					);
					// Remove the old field properly with delete
					const _templateInNewData = getValueAtPath(newData, templatePath);
					return newData;
				}

				// If no actionNode, use the node from the parent operation
				const operationPath = templatePath.slice(0, -1); // Go back one level
				const operation = getValueAtPath(data, operationPath);
				// If we found the operation and it has a node property, use that
				if (operation && typeof operation === "object" && operation.node) {
					setValueAtPath(
						newData,
						[...templatePath, "operationNode"],
						operation.node,
					);
					return newData;
				}
			}
		}

		// Fallback to deep transformer if we couldn't fix it specifically
		return transformNodeTypes(data);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Using any for generic deep copying
	const newData = structuredClone(data as Record<string, any>);

	// Case 1: Handle node type rename from "action" to "operation"
	if (
		(issue.path.includes("type") && issue.code === "invalid_type") ||
		issue.code === "invalid_union"
	) {
		// Get the path to the node
		const nodePath = issue.path.slice(0, issue.path.indexOf("type"));
		const node = getValueAtPath(data, nodePath);
		if (node && node.type === "action") {
			// Set type to "operation"
			setValueAtPath(newData, [...nodePath, "type"], "operation");
			return newData;
		}
	}

	// Case 2: Handle field renames in GenerationContext and GenerationTemplate
	if (issue.path.some((path) => path === "actionNode")) {
		// Fix for GenerationContext case
		const generationContextPath = [];
		// Find the path to the object containing actionNode
		for (let i = 0; i < issue.path.length; i++) {
			generationContextPath.push(issue.path[i]);
			const context = getValueAtPath(data, generationContextPath);
			if (context && typeof context === "object" && "actionNode" in context) {
				// Move actionNode data to operationNode
				setValueAtPath(
					newData,
					[...generationContextPath, "operationNode"],
					context.actionNode,
				);
				// Remove the old field using delete instead of undefined
				const _contextInNewData = getValueAtPath(
					newData,
					generationContextPath,
				);
				return newData;
			}
		}
	}

	// Case 3: Handle Job actions array rename to operations/steps in job/sequence
	if (
		issue.code === "invalid_type" &&
		(issue.path.includes("operations") || issue.path.includes("steps"))
	) {
		// Try to find the job/sequence object by looking at parent paths
		const operationPath = issue.path.includes("operations")
			? issue.path.slice(0, issue.path.indexOf("operations"))
			: issue.path.slice(0, issue.path.indexOf("steps"));
		const jobOrSequence = getValueAtPath(data, operationPath);
		// Look for a parent with 'actions' array
		if (jobOrSequence && typeof jobOrSequence === "object") {
			// Check if this object has an actions array that we need to migrate
			if (Array.isArray(jobOrSequence.actions)) {
				// Copy the actions array to operations (legacy compatibility)
				if (issue.path.includes("operations")) {
					setValueAtPath(
						newData,
						[...operationPath, "operations"],
						jobOrSequence.actions,
					);
				}
				// Copy the actions array to steps (current format)
				if (issue.path.includes("steps")) {
					setValueAtPath(
						newData,
						[...operationPath, "steps"],
						jobOrSequence.actions,
					);
				}
				return newData;
			}
		}

		// If we have nested workflows, we need a deeper transformation
		if (issue.path.includes("editingWorkflows")) {
			// Use the deep transformer for complex workflow structures
			return transformNodeTypes(data);
		}
	}

	// Case 4: Handle jobs array rename to sequences
	if (issue.code === "invalid_type" && issue.path.includes("sequences")) {
		// Try to find the workflow object by looking at parent paths
		const sequencePath = issue.path.slice(0, issue.path.indexOf("sequences"));
		const workflow = getValueAtPath(data, sequencePath);
		// Look for a parent with 'jobs' array
		if (workflow && typeof workflow === "object") {
			// Check if this object has a jobs array that we need to migrate
			if (Array.isArray(workflow.jobs)) {
				// Copy the jobs array to sequences (current format)
				setValueAtPath(
					newData,
					[...sequencePath, "sequences"],
					workflow.jobs.map((job: unknown) => transformNodeTypes(job)),
				);
				return newData;
			}
		}
	}

	// For any errors involving generationTemplate, use the deep transformer
	if (issue.path.some((segment) => segment === "generationTemplate")) {
		return transformNodeTypes(data);
	}

	// If none of the specific fixes worked, apply the deep transformation
	// This ensures all actionNode instances will be properly converted
	if (
		isObject(data) &&
		(JSON.stringify(data).includes('"actionNode":') ||
			JSON.stringify(data).includes('"type":"action"'))
	) {
		return transformNodeTypes(data);
	}

	return data;
}
