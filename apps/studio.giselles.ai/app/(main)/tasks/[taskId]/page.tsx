import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";
import { TaskLayout } from "@/components/task/task-layout";
import { logger } from "@/lib/logger";
import { createAndStartTask } from "../../lib/create-and-start-task";
import { loadStageAppsData } from "../../lib/stage-apps";
import { StageAppSelectionProvider } from "../../stores/stage-app-selection-store";
import { TaskClient } from "./ui/task-client";
import { getTaskAppId, getTaskData } from "./ui/task-data";
import { TaskOverlayReset } from "./ui/task-overlay-reset";
import { TaskStageInput } from "./ui/task-stage-input.client";

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
	const [taskData, stageAppsData, taskAppId] = await Promise.all([
		getTaskData(taskId),
		loadStageAppsData(),
		getTaskAppId(taskId),
	]);

	async function refreshAction() {
		"use server";

		return await getTaskData(taskId);
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
				<StageAppSelectionProvider initialSelectedAppId={taskAppId}>
					<TaskStageInput
						apps={[...stageAppsData.sampleApps, ...stageAppsData.apps]}
						createAndStartTaskAction={createAndStartTask}
					/>
				</StageAppSelectionProvider>
			</div>
		</TaskLayout>
	);
}
