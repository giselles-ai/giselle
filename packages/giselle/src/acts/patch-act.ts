import { Task, type TaskId } from "@giselles-ai/protocol";
import { taskPath } from "../path";
import type { GiselleContext } from "../types";
import {
	type Patch,
	patchTask as patchTaskObject,
} from "./object/patch-object";

export type { Patch };

export async function patchTask(args: {
	context: GiselleContext;
	taskId: TaskId;
	patches: Patch[];
}) {
	// Get the current task
	const currentTask = await args.context.storage.getJson({
		path: taskPath(args.taskId),
		schema: Task,
	});

	// Always update the updatedAt field
	const allPatches: Patch[] = [
		...args.patches,
		{ path: "updatedAt", set: Date.now() },
	];

	// Apply the patches
	const updatedTask = patchTaskObject(currentTask, ...allPatches);

	await args.context.storage.setJson({
		path: taskPath(args.taskId),
		data: updatedTask,
	});

	return updatedTask;
}
