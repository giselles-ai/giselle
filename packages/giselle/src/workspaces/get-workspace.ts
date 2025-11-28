import type { WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { getWorkspace as getWorkspaceInternal } from "./utils";

export async function getWorkspace(args: {
	context: GiselleContext;
	workspaceId: WorkspaceId;
}) {
	return await getWorkspaceInternal({
		context: args.context,
		workspaceId: args.workspaceId,
	});
}
