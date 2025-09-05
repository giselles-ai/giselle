"use server";

import type { FlowTrigger, WorkspaceId } from "@giselle-sdk/data-type";
import { isTriggerNode } from "@giselle-sdk/data-type";
import type { ParameterItem } from "@giselle-sdk/giselle";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { giselleEngine } from "@/app/giselle-engine";
import { acts as actsSchema, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import type { TeamId } from "@/services/teams";

export async function fetchWorkspaceFlowTrigger(workspaceId: string): Promise<{
	flowTrigger: FlowTrigger;
	workspaceName: string;
} | null> {
	try {
		const workspace = await giselleEngine.getWorkspace(
			workspaceId as WorkspaceId,
			true,
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
			flowTriggerId: triggerNode.content.state.flowTriggerId,
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
	flowTrigger: FlowTrigger,
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

		after(() =>
			giselleEngine.startAct({
				actId: act.id,
			}),
		);

		revalidatePath("/stage/showcase");
		revalidatePath("/stage/acts");
	} catch (error) {
		console.error("Failed to run workspace app:", error);
		throw new Error("Failed to start the app. Please try again.");
	}
}
