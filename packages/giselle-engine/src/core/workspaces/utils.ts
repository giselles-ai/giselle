import { Workspace, type WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";

export function workspacePath(workspaceId: WorkspaceId) {
	return `workspaces/${workspaceId}/workspace.json`;
}

export async function setWorkspace({
	storage,
	workspaceId,
	workspace,
}: {
	storage: Storage;
	workspaceId: WorkspaceId;
	workspace: Workspace;
}) {
	await storage.setItem(workspacePath(workspaceId), workspace, {
		// Disable caching by setting cacheControlMaxAge to 0 for Vercel Blob storage
		cacheControlMaxAge: 0,
	});
}

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
