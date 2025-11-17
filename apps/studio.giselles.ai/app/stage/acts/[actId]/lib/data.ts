import type { TaskId } from "@giselles-ai/giselle";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import type { SidebarDataObject } from "../ui/sidebar";

export async function getSidebarDataObject(actId: TaskId) {
	const act = await giselle.getAct({ actId });
	const dbAct = await db.query.acts.findFirst({
		where: (tasks, { eq }) => eq(tasks.sdkActId, actId),
		with: {
			team: true,
		},
	});
	if (dbAct === undefined) {
		throw new Error(`Task with id ${actId} not found`);
	}
	const trigger = await giselle.getTrigger({
		triggerId: dbAct?.sdkFlowTriggerId,
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
