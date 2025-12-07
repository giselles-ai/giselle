"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { Task } from "@giselles-ai/protocol";
import { FilePenLine } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface TopSectionData {
	// TODO: task property is reserved for future use
	task: Task;
	workspaceId: string;
}

export function TopSection({ data }: { data: Promise<TopSectionData> }) {
	const resolvedData = use(data);

	return (
		<div className="w-full pb-6">
			<div className="max-w-[640px] min-w-[320px] mx-auto">
				{/* App Summary Section */}
				<div>
					{/* Title placeholder */}
					<div className="flex items-center gap-3 mb-3">
						<h3 className="text-[20px] font-normal text-inverse">
							{/* App summary title will be displayed here */}
							App summary title
						</h3>
						<Link
							href={`/workspaces/${resolvedData.workspaceId}`}
							className="inline-block"
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
