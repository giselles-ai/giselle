import type { TaskId } from "@giselles-ai/giselle";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import type { SidebarDataObject } from "../ui/sidebar";

export async function getSidebarDataObject(taskId: TaskId) {
	const task = await giselle.getTask({ taskId });
	if (task.starter.type !== "app") {
		throw new Error(`Task with id ${taskId} is not an app`);
	}
	const appId = task.starter.appId;
	const app = await db.query.apps.findFirst({
		where: (apps, { eq }) => eq(apps.id, appId),
		with: {
			team: {
				columns: {
					name: true,
				},
			},
		},
	});
	if (app === undefined) {
		throw new Error(`App with id ${appId} not found`);
	}
	const giselleApp = await giselle.getApp({ appId });
	return {
		task,
		appName: giselleApp.name,
		teamName: app.team.name,
		appParameters: giselleApp.parameters,
		iconName: giselleApp.iconName,
	} satisfies SidebarDataObject;
}
