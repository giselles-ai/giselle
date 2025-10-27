import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
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
