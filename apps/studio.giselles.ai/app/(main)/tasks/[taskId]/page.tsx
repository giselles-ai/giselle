import {
	getInputAreaHeaderControlsData,
	InputAreaHeaderControls,
} from "./ui/input-area-header-controls";
import { InputAreaPlaceholder } from "./ui/input-area-placeholder";
import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { TaskHeader } from "@/components/task/task-header";
import { TaskLayout } from "@/components/task/task-layout";
import { StepsSectionClient } from "./ui/experimental/steps-section-client";
import { getStepsSectionData } from "./ui/experimental/steps-section-data";
import { getTaskHeaderData } from "./ui/task-header";
import { TaskOverlayReset } from "./ui/task-overlay-reset";

export default async function ({
	params,
}: {
	params: Promise<{ taskId: string }>;
}) {
	const { taskId: taskIdParam } = await params;
	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		throw new Error(`Invalid task ID: ${taskIdParam}`);
	}
	const taskId = result.data;
	const [taskHeaderData, stepsSectionData, inputAreaHeaderControlsData] =
		await Promise.all([
			getTaskHeaderData({ taskId }),
			getStepsSectionData(taskId),
			getInputAreaHeaderControlsData(taskId),
		]);

	async function refreshAction() {
		"use server";

		return await getStepsSectionData(taskId);
	}

	return (
		<TaskLayout>
			<TaskOverlayReset />
			{/* Top Section */}
			<TaskHeader {...taskHeaderData} />
			<div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
				{/* Steps Section */}
				<StepsSectionClient
					initial={stepsSectionData}
					refreshAction={refreshAction}
				/>
			</div>

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
