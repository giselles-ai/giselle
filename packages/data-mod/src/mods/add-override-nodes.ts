import type { $ZodIssue } from "@zod/core";
import { isObject, setValueAtPath } from "../utils";

export function addOverrideNodes(data: unknown, issue: $ZodIssue) {
	const lastPath = issue.path[issue.path.length - 1];
	if (lastPath !== "overrideNodes") {
		return data;
	}
	if (!isObject(data)) {
		return data;
	}
	const newData = { ...data };
	setValueAtPath(newData, issue.path, []);
	return newData;
}
