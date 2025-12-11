import { TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import {
	TaskHeader as TaskHeaderUI,
	type TaskHeaderProps as TaskHeaderUIProps,
} from "@/components/task/task-header";
import { db, tasks } from "@/db";
import { logger } from "@/lib/logger";

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
	const [workspace, app, input] = await Promise.all([
		giselle.getWorkspace(task.workspaceId),
		getAppByTaskId(taskId),
		getTaskInput(taskId),
	]);

	return {
		status: task.status,
		title: `${workspace.name}:${taskId}`,
		description: app.description,
		workspaceId: task.workspaceId,
		input,
	} satisfies TaskHeaderUIProps;
}

/**
 * Since the input for executing a Task is not stored in the Task itself
 * but in the Generation, we retrieve it from the Generation of the first Step
 * associated with the Task.
 */
async function getTaskInput(taskId: TaskId) {
	const task = await giselle.getTask({ taskId });
	const firstStep = task.sequences[0]?.steps?.[0];
	if (firstStep === undefined) {
		logger.warn(`Task ${taskId} has no steps`);
		return null;
	}
	const firstStepGeneration = await giselle.getGeneration(
		firstStep.generationId,
	);
	if (firstStepGeneration === undefined) {
		logger.warn(`Task ${taskId}, Step ${firstStep.id} has no generation`);
		return null;
	}
	const inputs = firstStepGeneration?.context.inputs;

	// inputs is an optional array, but in the Task use case it should be
	// an array with length 1, so log a warning if it's different
	if (inputs?.length !== 1) {
		return null;
	}
	const firstInput = inputs[0];
	// github-webhook-event is not expected in this Task use case
	if (firstInput.type !== "parameters") {
		return null;
	}
	return firstInput;
}

export async function TaskHeader({
	params,
}: {
	params: Promise<{ taskId: string }>;
}) {
	const data = await getTopSectionData({ params });
	return <TaskHeaderUI {...data} />;
}
