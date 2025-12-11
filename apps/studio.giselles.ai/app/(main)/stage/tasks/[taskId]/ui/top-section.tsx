"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { TaskId } from "@giselles-ai/protocol";
import {
	type StreamDataEventHandler,
	TaskStreamReader,
} from "@giselles-ai/react";
import { FilePenLine } from "lucide-react";
import Link from "next/link";
import { Suspense, use, useCallback, useState } from "react";
import { TaskInput } from "./task-input";
import type { TaskInputData } from "./task-input-types";
import type { TopSectionData } from "./top-section-data";

export function TopSection({
	topSectionDataPromise,
	taskId,
	taskInputPromise,
}: {
	topSectionDataPromise: Promise<TopSectionData>;
	taskId: TaskId;
	taskInputPromise?: Promise<TaskInputData>;
}) {
	const { app, task: initialTask, workspace } = use(topSectionDataPromise);
	const [task, setTask] = useState(initialTask);

	const updateTask = useCallback<StreamDataEventHandler>((streamData) => {
		setTask(streamData.task);
	}, []);

	return (
		<TaskStreamReader taskId={taskId} onUpdateAction={updateTask}>
			<div className="w-full pb-3  bg-[color:var(--color-background)]">
				{/* Top gradient separator to soften the edge against the header */}
				<div className="h-4 bg-gradient-to-b from-[color:var(--color-background)] to-transparent pointer-events-none" />
				<div className="mx-auto pt-2">
					{/* App Summary Section */}
					<div>
						{/* Task Status */}
						<div className="mb-2">
							{task.status === "created" ? (
								<StatusBadge status="success">Completed</StatusBadge>
							) : task.status === "inProgress" ? (
								<StatusBadge status="info">In Progress</StatusBadge>
							) : task.status === "completed" ? (
								<StatusBadge status="success">Completed</StatusBadge>
							) : task.status === "failed" ? (
								<StatusBadge status="error">Failed</StatusBadge>
							) : (
								<StatusBadge status="ignored">Cancelled</StatusBadge>
							)}
						</div>
						{/* Title */}
						<div className="flex items-center gap-3 mb-1">
							<h3 className="text-[20px] font-normal text-inverse">
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
						{app.description.length > 0 && (
							<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3 w-full">
								<span className="text-text-muted text-[13px] font-semibold shrink-0">
									App summary:
								</span>
								<p className="text-[14px] font-normal text-inverse leading-relaxed">
									{app.description}
								</p>
							</div>
						)}
					</div>

					{/* Task input preview */}
					<div className="mt-3">
						<Suspense fallback={<div>Loading task input...</div>}>
							<TaskInput taskInputPromise={taskInputPromise} />
						</Suspense>
					</div>
				</div>
			</div>
		</TaskStreamReader>
	);
}
