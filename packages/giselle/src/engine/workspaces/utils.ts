import { Node, Workspace, type WorkspaceId } from "@giselle-ai/data-type";
import { parseAndMod } from "../../data-mod";
import type { GiselleStorage } from "../storage";

function workspacePath(workspaceId: WorkspaceId) {
	return `workspaces/${workspaceId}/workspace.json`;
}

export async function setWorkspace({
	workspaceId,
	workspace,
	storage,
}: {
	workspaceId: WorkspaceId;
	workspace: Workspace;
	storage: GiselleStorage;
}) {
	await storage.setJson({
		path: workspacePath(workspaceId),
		data: workspace,
	});
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
	storage,
	templateWorkspaceId,
	newWorkspaceId,
}: {
	storage: GiselleStorage;
	templateWorkspaceId: WorkspaceId;
	newWorkspaceId: WorkspaceId;
}) {
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
