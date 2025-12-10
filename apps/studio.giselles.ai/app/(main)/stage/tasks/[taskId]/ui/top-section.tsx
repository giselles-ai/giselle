"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { Task, TaskId } from "@giselles-ai/protocol";
import {
	type StreamDataEventHandler,
	TaskStreamReader,
} from "@giselles-ai/react";
import { FilePenLine } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useState } from "react";

interface TopSectionData {
	// TODO: task property is reserved for future use
	task: Task;
	workspaceId: string;
}

export function TopSection({
	data,
	taskId,
}: {
	data: Promise<TopSectionData>;
	taskId: TaskId;
}) {
	const resolvedData = use(data);
	const defaultTask = resolvedData.task;
	const [task, setTask] = useState(defaultTask);

	const updateTask = useCallback<StreamDataEventHandler>((streamData) => {
		setTask(streamData.task);
	}, []);

	return (
		<TaskStreamReader taskId={taskId} onUpdateAction={updateTask}>
			<div className="w-full pb-3 sticky top-0 z-10 bg-[color:var(--color-background)]">
				<div className="max-w-[640px] min-w-[320px] mx-auto pt-2">
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
						{/* Title placeholder */}
						<div className="flex items-center gap-3 mb-1">
							<h3 className="text-[20px] font-normal text-inverse">
								{/* App summary title will be displayed here */}
								App summary title
							</h3>
							<Link
								href={`/workspaces/${resolvedData.workspaceId}`}
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
		</TaskStreamReader>
	);
}
