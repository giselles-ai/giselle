import {
	convertContentGenerationToTextGeneration,
	convertTextGenerationToContentGeneration,
} from "@giselles-ai/node-registry";
import {
	isContentGenerationNode,
	isTextGenerationNode,
	Node,
	Workspace,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { parseAndMod } from "../data-mod";
import type { GiselleContext } from "../types";

function workspacePath(workspaceId: WorkspaceId) {
	return `workspaces/${workspaceId}/workspace.json`;
}

export async function setWorkspace({
	workspaceId,
	workspace,
	context,
}: {
	workspaceId: WorkspaceId;
	workspace: Workspace;
	context: GiselleContext;
}) {
	await context.storage.setJson({
		path: workspacePath(workspaceId),
		data: {
			...workspace,
			nodes: workspace.nodes.map((node) => {
				if (!context.experimental_contentGenerationNode) {
					return node;
				}
				if (!isContentGenerationNode(node)) {
					return node;
				}
				return convertContentGenerationToTextGeneration(node);
			}),
		},
	});
}

export async function getWorkspace({
	context,
	workspaceId,
}: {
	context: GiselleContext;
	workspaceId: WorkspaceId;
}) {
	const workspace = await context.storage.getJson({
		path: workspacePath(workspaceId),
		// bypassingCache: true,
		schema: Workspace,
	});
	const nodes = workspace.nodes
		.map((node) => parseAndMod(Node, node))
		.map((node) => {
			if (!context.experimental_contentGenerationNode) {
				return node;
			}
			if (!isTextGenerationNode(node)) {
				return node;
			}
			return convertTextGenerationToContentGeneration(node);
		});
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
