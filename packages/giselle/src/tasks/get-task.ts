import type { TaskId } from "@giselles-ai/protocol";
import { Task } from "@giselles-ai/protocol";
import { taskPath } from "../path";
import type { GiselleContext } from "../types";

export async function getTask(args: {
	taskId: TaskId;
	context: GiselleContext;
}) {
	const task = await args.context.storage.getJson({
		path: taskPath(args.taskId),
		schema: Task,
	});
	return task;
}
