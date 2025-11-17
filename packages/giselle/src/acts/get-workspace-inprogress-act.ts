import type { WorkspaceId } from "@giselles-ai/protocol";
import { Task, TaskIndexObject } from "@giselles-ai/protocol";
import { taskPath, workspaceTaskPath } from "../path";
import type { GiselleContext } from "../types";
import { getWorkspaceIndex } from "../utils/workspace-index";

export async function getWorkspaceInprogressTask({
	context,
	workspaceId,
}: {
	context: GiselleContext;
	workspaceId: WorkspaceId;
}) {
	context.logger.debug("getWorkspaceInprogressTask");
	const workspaceTaskIndexes = await getWorkspaceIndex({
		context,
		indexPath: workspaceTaskPath(workspaceId),
		itemSchema: TaskIndexObject,
	});
	context.logger.debug(
		{ workspaceTaskIndices: workspaceTaskIndexes },
		"workspaceTaskIndices:",
	);
	const workspaceTasks = (
		await Promise.all(
			workspaceTaskIndexes.map(async (workspaceTaskIndex) => {
				try {
					return await context.storage.getJson({
						path: taskPath(workspaceTaskIndex.id),
						schema: Task,
					});
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					context.logger.warn(
						{
							taskId: workspaceTaskIndex.id,
							error: errorMessage,
						},
						"Failed to load workspace task; skipping.",
					);
					return null;
				}
			}),
		)
	).filter((task): task is Task => task !== null);
	context.logger.debug({ workspaceTasks }, "workspaceTasks:");
	const inprogressTasks = workspaceTasks
		.sort((a, b) => b.createdAt - a.createdAt)
		.filter((a) => a.status === "inProgress");
	context.logger.debug({ inprogressTasks }, "inprogressTasks:");
	if (inprogressTasks.length === 0) {
		context.logger.debug("inprogress tasks none");
		return undefined;
	}
	if (inprogressTasks.length > 1) {
		context.logger.warn(
			`workspace(${workspaceId}) has ${inprogressTasks.length} tasks.`,
		);
	}
	context.logger.debug(`return inprogress task(${inprogressTasks[0].id})`);
	return inprogressTasks[0];
}
