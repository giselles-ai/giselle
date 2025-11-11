"use server";

import type {
	ParameterItem,
	Trigger,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { isTriggerNode } from "@giselles-ai/protocol";
import { revalidatePath } from "next/cache";
import { giselleEngine } from "@/app/giselle-engine";
import { acts as actsSchema, db } from "@/db";
import { fetchCurrentUser } from "@/services/accounts";
import type { TeamId } from "@/services/teams";

export async function fetchWorkspaceFlowTrigger(workspaceId: string): Promise<{
	flowTrigger: Trigger;
	workspaceName: string;
} | null> {
	try {
		const workspace = await giselleEngine.getWorkspace(
			workspaceId as WorkspaceId,
		);

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

		const flowTrigger = await giselleEngine.getTrigger({
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
		const { act } = await giselleEngine.createAct({
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
			sdkActId: act.id,
			sdkFlowTriggerId: flowTrigger.id,
			sdkWorkspaceId: flowTrigger.workspaceId,
		});

		await giselleEngine.startAct({
			actId: act.id,
			generationOriginType: "stage",
		});

		revalidatePath("/stage/showcase");
		revalidatePath("/stage/acts");
	} catch (error) {
		console.error("Failed to run workspace app:", error);
		throw new Error("Failed to start the app. Please try again.");
	}
}
