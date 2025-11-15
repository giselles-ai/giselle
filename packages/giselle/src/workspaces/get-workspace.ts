import type { WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { getWorkspace as getWorkspaceInternal } from "./utils";

export async function getWorkspace(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	return await getWorkspaceInternal({
		storage: args.context.storage,
		workspaceId: args.workspaceId,
	});
}
