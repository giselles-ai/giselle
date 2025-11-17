import type { TaskId } from "@giselles-ai/protocol";
import { NodeGenerationIndex } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { taskGenerationIndexesPath } from "../../path";

export async function getTaskGenerationIndexes(args: {
	taskId: TaskId;
	storage: GiselleStorage;
}) {
	if (!(await args.storage.exists(taskGenerationIndexesPath(args.taskId)))) {
		return undefined;
	}
	return await args.storage.getJson({
		path: taskGenerationIndexesPath(args.taskId),
		schema: NodeGenerationIndex.array(),
	});
}
