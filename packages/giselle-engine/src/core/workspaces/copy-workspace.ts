import {
	Workspace,
	type WorkspaceId,
	generateInitialWorkspace,
} from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

export async function copyWorkspace(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	const sourceWorkspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: args.workspaceId,
	});

	const newWorkspace = generateInitialWorkspace();

	const workspaceCopy: Workspace = {
		...newWorkspace,
		name: `Copy of ${sourceWorkspace.name ?? ""}`,
		nodes: sourceWorkspace.nodes,
		connections: sourceWorkspace.connections,
		ui: sourceWorkspace.ui,
		editingWorkflows: sourceWorkspace.editingWorkflows,
	};

	await Promise.all([
		setWorkspace({
			storage: args.context.storage,
			workspaceId: workspaceCopy.id,
			workspace: Workspace.parse(workspaceCopy),
		}),
		copyFiles({
			storage: args.context.storage,
			templateWorkspaceId: args.workspaceId,
			newWorkspaceId: workspaceCopy.id,
		}),
	]);

	return workspaceCopy;
}
