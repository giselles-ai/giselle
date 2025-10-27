import { Node, Workspace, type WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { parseAndMod } from "../../data-mod";
import type { GiselleStorage } from "../experimental_storage";

function workspacePath(workspaceId: WorkspaceId) {
	return `workspaces/${workspaceId}/workspace.json`;
}

export async function setWorkspace({
	deprecated_storage,
	workspaceId,
	workspace,
	storage,
	useExperimentalStorage,
}: {
	deprecated_storage: Storage;
	workspaceId: WorkspaceId;
	workspace: Workspace;
	storage: GiselleStorage;
	useExperimentalStorage: boolean;
}) {
	if (useExperimentalStorage) {
		await storage.setJson({
			path: workspacePath(workspaceId),
			data: workspace,
		});
	} else {
		await deprecated_storage.setItem(workspacePath(workspaceId), workspace, {
			// Disable caching by setting cacheControl to 0 for Supabase storage
			cacheControl: 0,
		});
	}
}

export async function getWorkspace({
	storage,
	workspaceId,
}: {
	storage: GiselleStorage;
	workspaceId: WorkspaceId;
}) {
	const workspace = await storage.getJson({
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

/** @todo update new fileId for each file */
export async function copyFiles({
	deprecated_storage,
	storage,
	templateWorkspaceId,
	newWorkspaceId,
	useExperimentalStorage,
}: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	templateWorkspaceId: WorkspaceId;
	newWorkspaceId: WorkspaceId;
	useExperimentalStorage: boolean;
}) {
	if (useExperimentalStorage) {
		const prefix = `workspaces/${templateWorkspaceId}/files/`;
		const fileKeys: string[] = [];
		let cursor: string | undefined;

		while (true) {
			const result = await storage.listBlobs({
				prefix,
				cursor,
			});

			fileKeys.push(
				...result.blobs
					.map((blob) => blob.pathname)
					.filter((pathname) => pathname.startsWith(prefix)),
			);

			if (!result.hasMore || !result.cursor) {
				break;
			}

			cursor = result.cursor;
		}

		await Promise.all(
			fileKeys.map(async (fileKey) => {
				const target = fileKey.replace(
					`workspaces/${templateWorkspaceId}/files/`,
					`workspaces/${newWorkspaceId}/files/`,
				);
				await storage.copy(fileKey, target);
			}),
		);

		return;
	}

	const fileKeys = await deprecated_storage.getKeys(
		`workspaces/${templateWorkspaceId}/files`,
	);

	await Promise.all(
		fileKeys.map(async (fileKey) => {
			const target = fileKey.replace(
				/workspaces:wrks-\w+:files:/,
				`workspaces:${newWorkspaceId}:files:`,
			);
			const file = await deprecated_storage.getItemRaw(fileKey);
			await deprecated_storage.setItemRaw(target, file);
		}),
	);
}
