import type { ZodIssue, ZodSchema, z } from "zod";
import { addAccessorToInput } from "./mods/add-accessor-to-input";
import { addOverrideNodes } from "./mods/add-override-nodes";
import { addWorkspaceIdToOriginRun } from "./mods/add-workspace-id-to-origin-run";
import { fixTypoAccesorToAccessor } from "./mods/fix-typo-accesor-to-accessor";
import { fixTypoQuquedAtToQueuedAt } from "./mods/fix-typo-ququedAt-queuedAt";
import { renameActionToOperation } from "./mods/rename-action-to-operation";

export function dataMod(data: unknown, issue: ZodIssue) {
	let modData = data;
	modData = fixTypoAccesorToAccessor(modData, issue);
	modData = addOverrideNodes(modData, issue);
	modData = fixTypoQuquedAtToQueuedAt(modData, issue);
	modData = renameActionToOperation(modData, issue);
	modData = addAccessorToInput(modData, issue);
	modData = addWorkspaceIdToOriginRun(modData, issue);
	return modData;
}

export function parseAndMod<T extends ZodSchema>(
	schema: T,
	data: unknown,
	prevError?: z.ZodError,
): z.infer<T> {
	const parseResult = schema.safeParse(data);
	if (parseResult.success) {
		return parseResult.data;
	}

	if (prevError?.toString() === parseResult.error.toString()) {
		throw parseResult.error;
	}

	let modData = data;
	for (const issue of parseResult.error.issues) {
		modData = dataMod(modData, issue);
	}
	return parseAndMod(schema, modData, parseResult.error);
}
