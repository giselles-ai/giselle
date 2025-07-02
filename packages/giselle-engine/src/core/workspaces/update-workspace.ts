import type { Workspace } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { setWorkspace } from "./utils";

export async function updateWorkspace(args: {
	context: GiselleEngineContext;
	workspace: Workspace;
}) {
	await setWorkspace({
		storage: args.context.storage,
		workspaceId: args.workspace.id,
		workspace: args.workspace,
	});
	return args.workspace;
}
