import type { $ZodIssue } from "@zod/core";
import type { ZodType, z } from "zod/v4";
import { addAccessorToInput } from "./mods/add-accessor-to-input";
import { addProviderToCommand } from "./mods/add-provider-to-command";
import { fixInvalidAppParameterId } from "./mods/fix-invalid-app-parameter-id";
import { fixTypoAccesorToAccessor } from "./mods/fix-typo-accesor-to-accessor";
import { fixTypoQuquedAtToQueuedAt } from "./mods/fix-typo-ququedAt-queuedAt";
import { renameActionToOperation } from "./mods/rename-action-to-operation";
import { unifyGitHubVectorStore } from "./mods/unify-github-vector-store";

function dataMod(data: unknown, issue: $ZodIssue) {
	let modData = data;
	modData = fixTypoAccesorToAccessor(modData, issue);
	modData = fixTypoQuquedAtToQueuedAt(modData, issue);
	modData = renameActionToOperation(modData, issue);
	modData = addAccessorToInput(modData, issue);
	modData = addProviderToCommand(modData, issue);
	modData = unifyGitHubVectorStore(modData, issue);
	modData = fixInvalidAppParameterId(modData, issue);
	return modData;
}

export function parseAndMod<T extends ZodType>(
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
		modData = dataMod(modData, issue as $ZodIssue);
	}
	return parseAndMod(schema, modData, parseResult.error);
}
