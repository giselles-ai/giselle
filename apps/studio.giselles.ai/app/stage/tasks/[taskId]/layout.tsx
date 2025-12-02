import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTopSectionData } from "./lib/data";
import { StepsSection } from "./ui/steps-section";
import { TopSection } from "./ui/top-section";
import "./mobile-scroll.css";
import { TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export default async function ({
	children,
	params,
}: React.PropsWithChildren<{
	params: Promise<{ taskId: string }>;
}>) {
	const { taskId: taskIdParam } = await params;

	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		notFound();
	}
	const taskId = result.data;
	const topSectionData = getTopSectionData(taskId);
	const taskPromise = giselle.getTask({ taskId });

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
				<div className="mt-8 pt-8 border-t border-border">
					<h2 className="text-[16px] font-medium text-text mb-4">
						Request new tasks in a new session
					</h2>
					{/* Input area will be added here */}
					<div className="rounded-lg border border-border bg-white/5 p-4">
						<input
							type="text"
							placeholder="Ask anything—powered by Giselle docs"
							className="w-full bg-transparent border-0 outline-none text-text placeholder:text-text-muted"
						/>
					</div>
				</div>

				{/* Children (step detail pages) */}
				{children}
			</div>
		</div>
	);
}
