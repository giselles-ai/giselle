import { notFound } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import { InputAreaHeaderControls } from "./ui/input-area-header-controls";
import { InputAreaPlaceholder } from "./ui/input-area-placeholder";
import { StepsSection } from "./ui/steps-section";
import { getTaskInput } from "./ui/task-input-data";
import { TopSection } from "./ui/top-section";
import { getTopSectionData } from "./ui/top-section-data";
import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export default async function ({
	params,
	children,
}: {
	params: Promise<{ taskId: string }>;
	children: React.ReactNode;
}) {
	const { taskId: taskIdParam } = await params;

	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		notFound();
	}
	const taskId = result.data;
	// Fetch task once and reuse for both sections
	const taskPromise = giselle.getTask({ taskId });
	const topSectionDataPromise = getTopSectionData({ params });
	const taskInputPromise = getTaskInput(taskId);

	return (
		<div className="bg-bg text-foreground min-h-screen font-sans">
			<div className="max-w-7xl mx-auto px-4 pt-0 pb-0 flex flex-col min-h-screen">
				<div className="flex-1">
					{/* Top Section */}
					<Suspense fallback={<div>Loading...</div>}>
						<TopSection
							topSectionDataPromise={topSectionDataPromise}
							taskId={taskId}
							taskInputPromise={taskInputPromise}
						/>
					</Suspense>

					{/* Steps Section */}
					<Suspense fallback={<div>Loading steps...</div>}>
						<StepsSection taskPromise={taskPromise} taskId={taskId} />
					</Suspense>

					{/* Render nested routes */}
					{children}
				</div>

				{/* Main Content Area - Request new tasks section (sticky inside main container) */}
				<div
					className="mt-8 sticky bottom-0 z-10 bg-[color:var(--color-background)] pb-4"
					style={{ marginBottom: "-1px" }}
				>
					{/* Top gradient separator */}
					<div className="h-6 -mt-6 bg-gradient-to-t from-[color:var(--color-background)] to-transparent pointer-events-none" />
					<div className="max-w-[640px] min-w-[320px] mx-auto">
						<div className="flex items-center justify-between mb-2">
							<h2 className="text-text-muted text-[13px] font-semibold">
								Request new tasks in a new session
							</h2>
							<Suspense fallback={null}>
								<InputAreaHeaderControls taskPromise={taskPromise} />
							</Suspense>
						</div>
						{/* TODO: Input area will be added here - placeholder for future functionality */}
						<InputAreaPlaceholder taskPromise={taskPromise} />
					</div>
				</div>
			</div>
		</div>
	);
}
