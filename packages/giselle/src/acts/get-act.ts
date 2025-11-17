import type { TaskId } from "@giselles-ai/protocol";
import { Task } from "@giselles-ai/protocol";
import { taskPath } from "../path";
import type { GiselleContext } from "../types";

export async function getAct(args: { actId: TaskId; context: GiselleContext }) {
	const act = await args.context.storage.getJson({
		path: taskPath(args.actId),
		schema: Task,
	});
	return act;
}
