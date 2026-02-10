"use server";

import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

export async function createAndStartTask(input: CreateAndStartTaskInputs) {
	const workspaceId = input.workspaceId ?? input.workspace?.id;

	if (workspaceId === undefined) {
		throw new Error("Workspace ID is required");
	}

	await assertWorkspaceAccess(workspaceId);

	const { task } = await giselle.createTask(input);
	await giselle.startTask({ taskId: task.id, generationOriginType: "stage" });
	return task.id;
}
