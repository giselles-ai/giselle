"use server";

import type {
	ParameterItem,
	Trigger,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { isTriggerNode } from "@giselles-ai/protocol";
import { revalidatePath } from "next/cache";
import { giselle } from "@/app/giselle";
import { acts as actsSchema, db } from "@/db";
import { fetchCurrentUser } from "@/services/accounts";
import type { TeamId } from "@/services/teams";

export async function fetchWorkspaceFlowTrigger(workspaceId: string): Promise<{
	flowTrigger: Trigger;
	workspaceName: string;
} | null> {
	try {
		const workspace = await giselle.getWorkspace(workspaceId as WorkspaceId);

		// Find trigger node
		const triggerNode = workspace.nodes.find(
			(node) =>
				isTriggerNode(node) && node.content.state.status === "configured",
		);

		if (
			!triggerNode ||
			!isTriggerNode(triggerNode) ||
			triggerNode.content.state.status !== "configured"
		) {
			return null;
		}

		const flowTrigger = await giselle.getTrigger({
			triggerId: triggerNode.content.state.flowTriggerId,
		});

		if (!flowTrigger) {
			return null;
		}

		return {
			flowTrigger,
			workspaceName: workspace.name ?? "Untitled",
		};
	} catch (error) {
		console.error("Error fetching workspace flow trigger:", error);
		return null;
	}
}

export async function runWorkspaceApp(
	teamId: string,
	flowTrigger: Trigger,
	parameterItems: ParameterItem[],
): Promise<void> {
	try {
		const user = await fetchCurrentUser();
		const { task } = await giselle.createTask({
			workspaceId: flowTrigger.workspaceId,
			nodeId: flowTrigger.nodeId,
			inputs: [
				{
					type: "parameters",
					items: parameterItems,
				},
			],
			generationOriginType: "stage",
		});

		const team = await db.query.teams.findFirst({
			where: (teams, { eq }) => eq(teams.id, teamId as TeamId),
		});
		if (team === undefined) {
			throw new Error("Team not found");
		}

		await db.insert(actsSchema).values({
			teamDbId: team.dbId,
			directorDbId: user.dbId,
			sdkActId: task.id,
			sdkFlowTriggerId: flowTrigger.id,
			sdkWorkspaceId: flowTrigger.workspaceId,
		});

		await giselle.startTask({
			taskId: task.id,
			generationOriginType: "stage",
		});

		revalidatePath("/stage/showcase");
		revalidatePath("/stage/acts");
	} catch (error) {
		console.error("Failed to run workspace app:", error);
		throw new Error("Failed to start the app. Please try again.");
	}
}
