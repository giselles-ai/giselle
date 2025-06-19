import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getWorkspaceIndex } from "../utils/workspace-index";
import { workspaceDataSourceIndexPath } from "./paths";
import { DataSourceIndexObject } from "./types/object";

export async function getWorkspaceDataSources(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	return await getWorkspaceIndex({
		storage: args.context.storage,
		indexPath: workspaceDataSourceIndexPath(args.workspaceId),
		itemSchema: DataSourceIndexObject,
	});
}
