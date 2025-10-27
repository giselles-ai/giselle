import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getWorkspace as getWorkspaceInternal } from "./utils";

export async function getWorkspace(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	useExperimentalStorage: boolean;
}) {
	return await getWorkspaceInternal({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
		workspaceId: args.workspaceId,
		useExperimentalStorage: args.useExperimentalStorage,
	});
}
