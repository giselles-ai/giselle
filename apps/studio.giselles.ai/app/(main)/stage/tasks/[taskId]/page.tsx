import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InputAreaHeaderControls } from "./ui/input-area-header-controls";
import { InputAreaPlaceholder } from "./ui/input-area-placeholder";
import { StepsSection } from "./ui/steps-section";
import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { TaskLayout } from "@/components/task/task-layout";
import { TaskHeader } from "./ui/task-header";

export default async function ({
	params,
}: {
	params: Promise<{ taskId: string }>;
}) {
	const { taskId: taskIdParam } = await params;

	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		notFound();
	}
	const taskId = result.data;
	// Fetch task once and reuse for both sections
	const taskPromise = giselle.getTask({ taskId });

	return (
		<TaskLayout>
			{/* Top Section */}
			<Suspense fallback={<div>Loading...</div>}>
				<TaskHeader params={params} />
			</Suspense>
			<div className="flex-1 overflow-y-auto pb-8">
				{/* Steps Section */}
				<Suspense fallback={<div>Loading steps...</div>}>
					<StepsSection taskPromise={taskPromise} taskId={taskId} />
				</Suspense>
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
					<Suspense fallback={null}>
						<InputAreaHeaderControls taskPromise={taskPromise} />
					</Suspense>
				</div>
				{/* TODO: Input area will be added here - placeholder for future functionality */}
				<InputAreaPlaceholder />
			</div>
		</TaskLayout>
	);
}
