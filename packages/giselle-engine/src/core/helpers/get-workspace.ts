import { Workspace, type WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { workspacePath } from "./workspace-path";

function parseAndRepairWorkspace(workspaceLike: unknown) {
	const parseResult = Workspace.safeParse(workspaceLike);
	if (parseResult.success) {
		return parseResult.data;
	}
	/** @todo repair */
	throw new Error(`Invalid workspace: ${parseResult.error}`);
}

export async function getWorkspace({
	storage,
	workspaceId,
}: {
	storage: Storage;
	workspaceId: WorkspaceId;
}) {
	const result = await storage.getItem(workspacePath(workspaceId));
	return parseAndRepairWorkspace(result);
}
