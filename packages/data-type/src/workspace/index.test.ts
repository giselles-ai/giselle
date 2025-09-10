import { expect, test } from "vitest";
import { generateInitialWorkspace, Workspace } from ".";

test("test", () => {
	const parse = Workspace.safeParse(generateInitialWorkspace());
	expect(parse.success).toBe(true);
	expect(parse.data?.ui.selectedConnectionIds).not.toBeUndefined();
	expect(parse.data?.ui.selectedConnectionIds?.length).toBe(0);
});
