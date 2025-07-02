import { Generation } from "@giselle-sdk/data-type";
import type { $ZodIssue } from "@zod/core";
import { expect, test } from "vitest";
import generationJson from "./fixtures/rename-action-to-operation/generation1.json";
import { renameActionToOperation } from "./rename-action-to-operation";

test("rename action to operation", () => {
	const firstAttempt = Generation.safeParse(generationJson);
	expect(firstAttempt.success).toBe(false);

	if (firstAttempt.success) {
		throw new Error("Unexpected success");
	}
	let modData: unknown = generationJson;
	for (const issue of firstAttempt.error.issues) {
		modData = renameActionToOperation(modData, issue as $ZodIssue);
	}
	const afterModData = Generation.safeParse(modData);
	expect(afterModData.success).toBe(true);
});
