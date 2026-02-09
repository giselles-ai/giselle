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
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";
import { getCurrentUser } from "@/lib/get-current-user";

export async function fetchWorkspaceFlowTrigger(workspaceId: string): Promise<{
	flowTrigger: Trigger;
	workspaceName: string;
} | null> {
	try {
		await assertWorkspaceAccess(workspaceId as WorkspaceId);
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
	flowTrigger: Trigger,
	parameterItems: ParameterItem[],
): Promise<void> {
	try {
		await assertWorkspaceAccess(flowTrigger.workspaceId);
		const user = await getCurrentUser();

		const workspace = await db.query.workspaces.findFirst({
			where: (workspaces, { eq }) => eq(workspaces.id, flowTrigger.workspaceId),
			columns: { teamDbId: true },
		});
		if (!workspace) {
			throw new Error("Workspace not found");
		}

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

		await db.insert(actsSchema).values({
			teamDbId: workspace.teamDbId,
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
