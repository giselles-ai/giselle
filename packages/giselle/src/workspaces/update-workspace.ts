import type { Workspace } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { setWorkspace } from "./utils";

export async function updateWorkspace(args: {
	context: GiselleContext;
	workspace: Workspace;
}) {
	await setWorkspace({
		workspaceId: args.workspace.id,
		workspace: args.workspace,
		context: args.context,
	});
	return args.workspace;
}
