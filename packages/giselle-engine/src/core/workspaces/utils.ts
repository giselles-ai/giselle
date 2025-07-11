import { parseAndMod } from "@giselle-sdk/data-mod";
import { Node, Workspace, type WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";

function workspacePath(workspaceId: WorkspaceId) {
	return `workspaces/${workspaceId}/workspace.json`;
}

export async function setWorkspace({
	storage,
	workspaceId,
	workspace,
	experimental_storage,
	useExperimentalStorage,
}: {
	storage: Storage;
	workspaceId: WorkspaceId;
	workspace: Workspace;
	experimental_storage: GiselleStorage;
	useExperimentalStorage: boolean;
}) {
	if (useExperimentalStorage) {
		await experimental_storage.setJson({
			path: workspacePath(workspaceId),
			data: workspace,
		});
	} else {
		await storage.setItem(workspacePath(workspaceId), workspace, {
			// Disable caching by setting cacheControl to 0 for Supabase storage
			cacheControl: 0,
		});
	}
}

export async function getWorkspace({
	storage,
	experimental_storage,
	useExperimentalStorage,
	workspaceId,
}: {
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage: boolean;
	workspaceId: WorkspaceId;
}) {
	if (useExperimentalStorage) {
		const workspace = await experimental_storage.getJson({
			path: workspacePath(workspaceId),
			// bypassingCache: true,
			schema: Workspace,
		});
		const nodes = workspace.nodes.map((node) => parseAndMod(Node, node));
		return {
			...workspace,
			nodes,
		};
	}
	const result = await storage.getItem(workspacePath(workspaceId), {
		bypassingCache: true,
	});
	const workspace = parseAndMod(
		Workspace,
		result,
	); /** @todo remove the underline if workpsace.node used Node Schema and delete editingWorkflows field */
	const nodes = workspace.nodes.map((node) => parseAndMod(Node, node));
	return {
		...workspace,
		nodes,
	};
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
