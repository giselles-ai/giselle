import { generateInitialWorkspace, Workspace } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { setWorkspace } from "./utils";

export async function createWorkspace(args: { context: GiselleContext }) {
	const workspace = generateInitialWorkspace();
	await setWorkspace({
		workspaceId: workspace.id,
		workspace: Workspace.parse(workspace),
		storage: args.context.storage,
	});
	return workspace;
}
