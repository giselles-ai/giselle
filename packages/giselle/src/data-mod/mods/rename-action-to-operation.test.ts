import { Generation } from "@giselles-ai/protocol";
import type { $ZodIssue } from "@zod/core";
import { expect, test } from "vitest";
import generationJson from "./fixtures/rename-taskion-to-operation/generation1.json";
import { renameTaskionToOperation } from "./rename-taskion-to-operation";

test("rename taskion to operation", () => {
	const firstAttempt = Generation.safeParse(generationJson);
	expect(firstAttempt.success).toBe(false);

	if (firstAttempt.success) {
		throw new Error("Unexpected success");
	}
	let modData: unknown = generationJson;
	for (const issue of firstAttempt.error.issues) {
		modData = renameTaskionToOperation(modData, issue as $ZodIssue);
	}
	const afterModData = Generation.safeParse(modData);
	expect(afterModData.success).toBe(true);
});
