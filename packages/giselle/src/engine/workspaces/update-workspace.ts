import type { Workspace } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { setWorkspace } from "./utils";

export async function updateWorkspace(args: {
	context: GiselleEngineContext;
	workspace: Workspace;
	useExperimentalStorage: boolean;
}) {
	await setWorkspace({
		storage: args.context.storage,
		workspaceId: args.workspace.id,
		workspace: args.workspace,
		experimental_storage: args.context.experimental_storage,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	return args.workspace;
}
