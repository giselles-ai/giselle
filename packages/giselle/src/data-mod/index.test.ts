import { Workspace } from "@giselle-ai/data-type";
import { expect, test } from "vitest";
import workspaceJson from "./fixtures/workspace1.json";

test("parseAndMod#1", () => {
	const parseResult = Workspace.safeParse(workspaceJson);
	expect(parseResult.success).toBeTruthy();
});
