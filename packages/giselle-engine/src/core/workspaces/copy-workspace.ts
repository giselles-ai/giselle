import {
	generateInitialWorkspace,
	Workspace,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

export async function copyWorkspace(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	name?: string;
}) {
	const sourceWorkspace = await getWorkspace({
		useExperimentalStorage: false,
		storage: args.context.storage,
		experimental_storage: args.context.experimental_storage,
		workspaceId: args.workspaceId,
	});

	const newWorkspace = generateInitialWorkspace();

	const workspaceCopy: Workspace = {
		...newWorkspace,
		name: args.name ?? `Copy of ${sourceWorkspace.name ?? ""}`,
		nodes: sourceWorkspace.nodes,
		connections: sourceWorkspace.connections,
		ui: sourceWorkspace.ui,
	};

	await Promise.all([
		setWorkspace({
			storage: args.context.storage,
			workspaceId: workspaceCopy.id,
			workspace: Workspace.parse(workspaceCopy),
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: false,
		}),
		copyFiles({
			storage: args.context.storage,
			templateWorkspaceId: args.workspaceId,
			newWorkspaceId: workspaceCopy.id,
		}),
	]);

	return workspaceCopy;
}
