import type { WorkspaceId } from "@giselles-ai/protocol";
import { Task, TaskIndexObject } from "@giselles-ai/protocol";
import { taskPath, workspaceTaskPath } from "../path";
import type { GiselleContext } from "../types";
import { getWorkspaceIndex } from "../utils/workspace-index";

export async function getWorkspaceActs(args: {
	context: GiselleContext;
	workspaceId: WorkspaceId;
}) {
	const workspaceActIndices = await getWorkspaceIndex({
		context: args.context,
		indexPath: workspaceTaskPath(args.workspaceId),
		itemSchema: TaskIndexObject,
	});
	const workspaceActs = (
		await Promise.all(
			workspaceActIndices.map(async (workspaceActIndex) => {
				try {
					return await args.context.storage.getJson({
						path: taskPath(workspaceActIndex.id),
						schema: Task,
					});
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					args.context.logger.warn(
						{
							actId: workspaceActIndex.id,
							error: errorMessage,
						},
						"Failed to load workspace act; skipping.",
					);
					return null;
				}
			}),
		)
	).filter((act): act is Task => act !== null);
	return workspaceActs;
}
