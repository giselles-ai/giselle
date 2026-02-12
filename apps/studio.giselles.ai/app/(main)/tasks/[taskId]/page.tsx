import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TaskLayout } from "@/components/task/task-layout";
import { db, tasks } from "@/db";
import { getCurrentUser } from "@/lib/get-current-user";
import { logger } from "@/lib/logger";
import { isMemberOfTeam } from "@/services/teams";
import { createAndStartTask } from "../../lib/create-and-start-task";
import { loadStageAppsData } from "../../lib/stage-apps";
import { TaskClient } from "./ui/task-client";
import { getTaskAppId, getTaskData } from "./ui/task-data";
import { TaskOverlayReset } from "./ui/task-overlay-reset";
import { TaskStageInput } from "./ui/task-stage-input.client";

async function getTaskTeamDbId(taskId: TaskId) {
	const task = await db
		.select({ teamDbId: tasks.teamDbId })
		.from(tasks)
		.where(eq(tasks.id, taskId))
		.limit(1);
	if (task.length === 0) {
		return undefined;
	}
	return task[0].teamDbId;
}

export default async function ({
	params,
}: {
	params: Promise<{ taskId: string }>;
}) {
	const { taskId: taskIdParam } = await params;
	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		logger.error(`Invalid task ID: ${taskIdParam}`);
		notFound();
	}
	const taskId = result.data;

	const [currentUser, taskTeamDbId] = await Promise.all([
		getCurrentUser(),
		getTaskTeamDbId(taskId),
	]);
	if (taskTeamDbId === undefined) {
		notFound();
	}

	const canAccessTask = await isMemberOfTeam(currentUser.dbId, taskTeamDbId);
	if (!canAccessTask) {
		notFound();
	}

	const [taskData, stageAppsData, taskAppId] = await Promise.all([
		getTaskData(taskId),
		loadStageAppsData(),
		getTaskAppId(taskId),
	]);

	async function refreshAction() {
		"use server";

		const [currentUser, taskTeamDbId] = await Promise.all([
			getCurrentUser(),
			getTaskTeamDbId(taskId),
		]);
		if (taskTeamDbId === undefined) {
			return { success: false as const, error: `Task not found: ${taskId}` };
		}
		const canAccessTask = await isMemberOfTeam(currentUser.dbId, taskTeamDbId);
		if (!canAccessTask) {
			return { success: false as const, error: "authorization error" };
		}

		return { success: true as const, data: await getTaskData(taskId) };
	}

	return (
		<TaskLayout>
			<TaskOverlayReset />
			<TaskClient initial={taskData} refreshAction={refreshAction} />

			{/* Main Content Area - Request new tasks section (sticky inside main container) */}
			<div
				className="bg-[color:var(--color-background)] pb-4 relative"
				style={{ marginBottom: "-1px" }}
			>
				{/* Top gradient separator */}
				<div className="w-full absolute h-6 -top-6 bg-gradient-to-t from-[color:var(--color-background)] to-transparent pointer-events-none" />
				<TaskStageInput
					apps={[...stageAppsData.sampleApps, ...stageAppsData.apps]}
					createAndStartTaskAction={createAndStartTask}
					initialSelectedAppId={taskAppId}
				/>
			</div>
		</TaskLayout>
	);
}
