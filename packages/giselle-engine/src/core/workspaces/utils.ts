import { parseAndMod } from "@giselle-sdk/data-mod";
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

export async function getWorkspace({
	storage,
	workspaceId,
}: {
	storage: Storage;
	workspaceId: WorkspaceId;
}) {
	const result = await storage.getItem(workspacePath(workspaceId));
	return parseAndMod(Workspace, result);
}

/** @todo update new fileId for each file */
export async function copyFiles({
	storage,
	templateWorkspaceId,
	newWorkspaceId,
}: {
	storage: Storage;
	templateWorkspaceId: WorkspaceId;
	newWorkspaceId: WorkspaceId;
}) {
	const fileKeys = await storage.getKeys(
		`workspaces/${templateWorkspaceId}/files`,
	);

	await Promise.all(
		fileKeys.map(async (fileKey) => {
			const file = await storage.getItemRaw(fileKey);
			await storage.setItemRaw(
				fileKey.replace(
					/workspaces:wrks-\w+:files:/,
					`workspaces:${newWorkspaceId}:files:`,
				),
				file,
			);
		}),
	);
}
