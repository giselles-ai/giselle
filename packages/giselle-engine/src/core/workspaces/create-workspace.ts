import { generateInitialWorkspace, Workspace } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { setWorkspace } from "./utils";

export async function createWorkspace(args: { context: GiselleEngineContext }) {
	const workspace = generateInitialWorkspace();
	await setWorkspace({
		storage: args.context.storage,
		workspaceId: workspace.id,
		workspace: Workspace.parse(workspace),
	});
	return workspace;
}
