"use server";

import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { giselle } from "@/app/giselle";

export async function createAndStartTask(input: CreateAndStartTaskInputs) {
	const { task } = await giselle.createTask(input);
	await giselle.startTask({ taskId: task.id, generationOriginType: "stage" });
	return task.id;
}
