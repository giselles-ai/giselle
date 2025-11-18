"use server";

import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { fetchCurrentUser } from "@/services/accounts";
import { isMemberOfTeam } from "@/services/teams";

export async function createAndStartTask(input: CreateAndStartTaskInputs) {
	const workspaceId = input.workspaceId ?? input.workspace?.id;

	if (workspaceId === undefined) {
		throw new Error("Workspace ID is required");
	}
	const [user, workspace] = await Promise.all([
		fetchCurrentUser(),
		db.query.workspaces.findFirst({
			where: (workspaceTable, { eq }) => eq(workspaceTable.id, workspaceId),
			columns: {
				teamDbId: true,
			},
		}),
	]);

	if (!workspace) {
		throw new Error("Workspace not found");
	}

	const hasAccess = await isMemberOfTeam(user.dbId, workspace.teamDbId);
	if (!hasAccess) {
		throw new Error("You are not authorized to run tasks for this workspace");
	}

	const { task } = await giselle.createTask(input);
	await giselle.startTask({ taskId: task.id, generationOriginType: "stage" });
	return task.id;
}
