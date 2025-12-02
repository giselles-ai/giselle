import type { TaskId } from "@giselles-ai/giselle";
import { giselle } from "@/app/giselle";
import type { TopSectionData } from "../ui/top-section";

export async function getTopSectionData(
	taskId: TaskId,
): Promise<TopSectionData> {
	const task = await giselle.getTask({ taskId });
	if (task.starter.type !== "app") {
		throw new Error(`Task with id ${taskId} is not an app`);
	}

	return {
		task,
		workspaceId: task.workspaceId,
	};
}
