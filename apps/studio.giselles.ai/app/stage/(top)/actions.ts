"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { giselleEngine } from "@/app/giselle-engine";
import { acts as actsSchema, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import type { PerformStagePayloads } from "./types";

export async function performStageAction(
	payloads: PerformStagePayloads,
): Promise<void> {
	try {
		const user = await fetchCurrentUser();
		const { act } = await giselleEngine.createAct({
			workspaceId: payloads.flowTrigger.workspaceId,
			nodeId: payloads.flowTrigger.nodeId,
			inputs: [
				{
					type: "parameters",
					items: payloads.parameterItems,
				},
			],
			generationOriginType: "stage",
		});

		const team = await db.query.teams.findFirst({
			where: (teams, { eq }) => eq(teams.id, payloads.teamId),
		});
		if (team === undefined) {
			throw new Error("Team not found");
		}

		await db.insert(actsSchema).values({
			teamDbId: team.dbId,
			directorDbId: user.dbId,
			sdkActId: act.id,
			sdkFlowTriggerId: payloads.flowTrigger.id,
			sdkWorkspaceId: payloads.flowTrigger.workspaceId,
		});

		after(() =>
			giselleEngine.startAct({
				actId: act.id,
			}),
		);

		revalidatePath("/stage");
	} catch (error) {
		console.error("Failed to perform stage action:", error);
		throw new Error("Failed to start the flow. Please try again.");
	}
}
