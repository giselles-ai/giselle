import { generateInitialWorkspace, Workspace } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { setWorkspace } from "./utils";

export async function createWorkspace(args: { context: GiselleEngineContext }) {
	const workspace = generateInitialWorkspace();
	await setWorkspace({
		workspaceId: workspace.id,
		workspace: Workspace.parse(workspace),
		storage: args.context.storage,
	});
	return workspace;
}
