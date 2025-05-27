import type { $ZodIssue } from "@zod/core";
import { isObject, setValueAtPath } from "../utils";

export function fixTypoQuquedAtToQueuedAt(data: unknown, issue: $ZodIssue) {
	if (
		issue.message !==
		"Generation fields don't match required fields for the specified status"
	) {
		return data;
	}
	if (!isObject(data)) {
		return data;
	}
	if ("ququedAt" in data) {
		const newData = { ...data };

		setValueAtPath(
			newData,
			["queuedAt"],
			// @ts-ignore previous field name for data mod: https://github.com/giselles-ai/giselle/pull/570
			data.ququedAt,
		);
		return newData;
	}
	return data;
}
