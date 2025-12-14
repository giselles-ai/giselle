import {
	getInputAreaHeaderControlsData,
	InputAreaHeaderControls,
} from "./ui/input-area-header-controls";
import { InputAreaPlaceholder } from "./ui/input-area-placeholder";
import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";
import { TaskLayout } from "@/components/task/task-layout";
import { logger } from "@/lib/logger";
import { TaskClient } from "./ui/experimental/task-client";
import { getTaskData } from "./ui/experimental/task-data";
import { TaskOverlayReset } from "./ui/task-overlay-reset";

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
	const [taskData, inputAreaHeaderControlsData] = await Promise.all([
		getTaskData(taskId),
		getInputAreaHeaderControlsData(taskId),
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
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-text-muted text-[13px] font-semibold">
						Request new tasks in a new session
					</h2>
					<InputAreaHeaderControls {...inputAreaHeaderControlsData} />
				</div>
				{/* TODO: Input area will be added here - placeholder for future functionality */}
				<InputAreaPlaceholder />
			</div>
		</TaskLayout>
	);
}
