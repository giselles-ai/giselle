import { expect, test } from "vitest";
import { generateInitialWorkspace, Workspace } from ".";

test("test", () => {
	const parse = Workspace.safeParse(generateInitialWorkspace());
	expect(parse.success).toBe(true);
});
