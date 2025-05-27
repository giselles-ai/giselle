import type { Input } from "@giselle-sdk/data-type";
import type { $ZodIssue } from "@zod/core";
import { getValueAtPath, isObject, setValueAtPath } from "../utils";

export function addAccessorToInput(data: unknown, issue: $ZodIssue) {
	// Check if this is an issue with a missing required accessor field
	const lastPath = issue.path[issue.path.length - 1];
	if (lastPath !== "accessor") {
		return data;
	}

	if (!isObject(data)) {
		return data;
	}

	const newData = { ...data };
	const inputPath = issue.path.slice(0, -1);
	const input = getValueAtPath(data, inputPath) as unknown as Input;

	// If the input has a label but no accessor, use the label as the accessor
	if (input?.label && input.accessor === undefined) {
		setValueAtPath(newData, [...inputPath, "accessor"], input.label);
	}

	return newData;
}
