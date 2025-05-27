import type { Output } from "@giselle-sdk/data-type";
import type { $ZodIssue } from "@zod/core";
import { getValueAtPath, isObject, setValueAtPath } from "../utils";

export function fixTypoAccesorToAccessor(data: unknown, issue: $ZodIssue) {
	const lastPath = issue.path[issue.path.length - 1];
	if (lastPath !== "accessor") {
		return data;
	}

	// Check if the path includes "outputs"
	const pathContainsOutput = issue.path.some(
		(segment) => typeof segment === "string" && segment === "outputs",
	);
	if (!pathContainsOutput) {
		return data;
	}

	if (!isObject(data)) {
		return data;
	}
	const newData = { ...data };
	const output = getValueAtPath(
		data,
		issue.path.slice(0, -1),
	) as unknown as Output;

	// set data[path].accesor to data[path].accessor
	setValueAtPath(
		newData,
		issue.path,
		// @ts-ignore previous field name for data mod: https://github.com/giselles-ai/giselle/pull/570
		output.accesor,
	);
	return newData;
}
