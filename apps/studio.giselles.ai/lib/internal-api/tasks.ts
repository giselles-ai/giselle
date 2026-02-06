"use server";

import type { CreateTaskInputs, StartTaskInputs } from "@giselles-ai/giselle";
import type { TaskId, WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

export async function createTask(input: CreateTaskInputs) {
	const workspaceId = input.workspaceId ?? input.workspace?.id;
	if (workspaceId === undefined) {
		throw new Error("workspaceId or workspace is required");
	}
	await assertWorkspaceAccess(workspaceId);
	return await giselle.createTask(input);
}

export async function startTask(input: StartTaskInputs) {
	const task = await giselle.getTask({ taskId: input.taskId });
	await assertWorkspaceAccess(task.workspaceId);
	await giselle.startTask(input);
}

export async function getWorkspaceInprogressTask(input: {
	workspaceId: WorkspaceId;
}) {
	await assertWorkspaceAccess(input.workspaceId);
	const task = await giselle.getWorkspaceInprogressTask(input);
	return { task };
}

export async function getTaskGenerationIndexes(input: { taskId: TaskId }) {
	const task = await giselle.getTask({ taskId: input.taskId });
	await assertWorkspaceAccess(task.workspaceId);
	return await giselle.getTaskGenerationIndexes(input);
}

export async function getWorkspaceTasks(input: { workspaceId: WorkspaceId }) {
	await assertWorkspaceAccess(input.workspaceId);
	const tasks = await giselle.getWorkspaceTasks({
		workspaceId: input.workspaceId,
	});
	return { tasks };
}
