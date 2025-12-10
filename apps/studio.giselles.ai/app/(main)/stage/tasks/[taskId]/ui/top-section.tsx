import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { TaskId } from "@giselles-ai/protocol";
import { FilePenLine } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { giselle } from "@/app/giselle";

export async function getTopSectionData({
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
	const task = await giselle.getTask({ taskId });
	const workspace = await giselle.getWorkspace(task.workspaceId);
	return {
		taskId,
		workspace: {
			name: workspace.name,
			id: workspace.id,
		},
	};
}

type TopSectionData = Awaited<ReturnType<typeof getTopSectionData>>;

export function TopSection({
	topSectionDataPromise,
}: {
	topSectionDataPromise: Promise<TopSectionData>;
}) {
	const { taskId, workspace } = use(topSectionDataPromise);

	return (
		<div className="w-full pb-3 sticky top-0 z-10 bg-[color:var(--color-background)]">
			{/* Top gradient separator to soften the edge against the header */}
			<div className="h-4 bg-gradient-to-b from-[color:var(--color-background)] to-transparent pointer-events-none" />
			<div className="max-w-[640px] min-w-[320px] mx-auto pt-2">
				{/* App Summary Section */}
				<div>
					{/* Title placeholder */}
					<div className="flex items-center gap-3 mb-1">
						<h3 className="text-[20px] font-normal text-inverse">
							{/* App summary title will be displayed here */}
							{workspace.name}:{taskId}
						</h3>
						<Link
							href={`/workspaces/${workspace.id}`}
							className="inline-block"
							target="_blank"
							rel="noreferrer"
						>
							<div className="group [&>div]:rounded-lg [&>div>div]:rounded-md [&>div>div]:text-[hsl(192,73%,84%)] [&>div>div]:border-[hsl(192,73%,84%)] [&>div>div]:transition-colors [&>div>div]:cursor-pointer hover:[&>div>div]:bg-[hsl(192,73%,84%)] hover:[&>div>div]:text-[hsl(192,73%,20%)]">
								<StatusBadge
									status="warning"
									variant="default"
									leftIcon={
										<FilePenLine className="stroke-[hsl(192,73%,84%)] stroke-[1.5] transition-colors group-hover:stroke-[hsl(192,73%,20%)]" />
									}
								>
									Edit in Studio
								</StatusBadge>
							</div>
						</Link>
					</div>
					{/* App summary heading + text (2-column layout to reduce height) */}
					<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3 w-full">
						<span className="text-text-muted text-[13px] font-semibold shrink-0">
							App summary:
						</span>
						<p className="text-[14px] font-normal text-inverse leading-relaxed">
							{/* App summary description will be displayed here */}
							App summary description will be displayed here.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
