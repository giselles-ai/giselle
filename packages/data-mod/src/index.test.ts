import { Workspace } from "@giselle-sdk/data-type";
import { describe, expect, test } from "vitest";
import { dataMod, parseAndMod } from ".";
import workspaceJson from "./fixtures/workspace1.json";
import { getValueAtPath } from "./utils";

test("parseAndMod#1", () => {
	const parseResult = Workspace.safeParse(workspaceJson);
	expect(parseResult.success).toBeFalsy();

	const mod = parseAndMod(Workspace, workspaceJson);
	const modParseResult = Workspace.safeParse(mod);
	expect(modParseResult.success).toBeTruthy();
});
