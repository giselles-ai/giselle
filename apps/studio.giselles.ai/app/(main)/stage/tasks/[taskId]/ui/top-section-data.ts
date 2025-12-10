import { TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { db, tasks } from "@/db";

async function getAppByTaskId(taskId: TaskId) {
	const dbApp = await db.query.apps.findFirst({
		columns: { id: true },
		where: (apps, { and, exists, eq }) =>
			exists(
				db
					.select({ id: tasks.id })
					.from(tasks)
					.where(and(eq(tasks.appDbId, apps.dbId), eq(tasks.id, taskId))),
			),
	});
	if (dbApp === undefined) {
		throw new Error(`App not found for task ID: ${taskId}`);
	}
	return await giselle.getApp({ appId: dbApp.id });
}

export async function getTopSectionData({
	params,
}: {
	params: Promise<{ taskId: string }>;
}) {
	const { taskId: taskIdParam } = await params;
	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		throw new Error(`Invalid task ID: ${taskIdParam}`);
	}
	const taskId = result.data;
	const task = await giselle.getTask({ taskId });
	const [workspace, app] = await Promise.all([
		giselle.getWorkspace(task.workspaceId),
		getAppByTaskId(taskId),
	]);

	return {
		taskId,
		task,
		app: {
			description: app.description,
		},
		workspace: {
			name: workspace.name,
			id: workspace.id,
		},
	};
}

export type TopSectionData = Awaited<ReturnType<typeof getTopSectionData>>;
