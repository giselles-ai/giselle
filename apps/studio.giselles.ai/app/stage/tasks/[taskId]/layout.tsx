import { notFound } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import { InputAreaPlaceholder } from "./ui/input-area-placeholder";
import { StepsSection } from "./ui/steps-section";
import { TopSection } from "./ui/top-section";
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
	const topSectionData = taskPromise.then((task) => ({
		task,
		workspaceId: task.workspaceId,
	}));

	return (
		<div className="bg-bg text-foreground min-h-screen font-sans">
			<div className="max-w-7xl mx-auto px-4 py-6">
				{/* Top Section */}
				<Suspense fallback={<div>Loading...</div>}>
					<TopSection data={topSectionData} />
				</Suspense>

				{/* Steps Section */}
				<Suspense fallback={<div>Loading steps...</div>}>
					<StepsSection taskPromise={taskPromise} taskId={taskId} />
				</Suspense>

				{/* Main Content Area - Request new tasks section */}
				<div className="mt-8 pt-8">
					<h2 className="text-text-muted text-[13px] font-semibold block mb-4">
						Request new tasks in a new session
					</h2>
					{/* TODO: Input area will be added here - placeholder for future functionality */}
					<InputAreaPlaceholder />
				</div>

				{/* Render nested routes */}
				{children}
			</div>
		</div>
	);
}
