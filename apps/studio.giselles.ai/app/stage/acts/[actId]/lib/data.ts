import type { ActId } from "@giselle-sdk/giselle";
import { giselleEngine } from "@/app/giselle-engine";
import { db } from "@/drizzle";
import type { SidebarDataObject } from "../ui/sidebar";

export async function getSidebarDataObject(actId: ActId) {
	const act = await giselleEngine.getAct({ actId });
	const dbAct = await db.query.acts.findFirst({
		where: (tasks, { eq }) => eq(tasks.sdkActId, actId),
		with: {
			team: true,
		},
	});
	if (dbAct === undefined) {
		throw new Error(`Act with id ${actId} not found`);
	}
	const trigger = await giselleEngine.getTrigger({
		flowTriggerId: dbAct?.sdkFlowTriggerId,
	});
	if (trigger?.configuration.provider !== "manual") {
		throw new Error(`Trigger with id ${dbAct?.sdkFlowTriggerId} is not manual`);
	}
	return {
		act,
		appName: act.name,
		teamName: dbAct.team.name,
		triggerParameters: trigger.configuration.event.parameters,
	} satisfies SidebarDataObject;
}
