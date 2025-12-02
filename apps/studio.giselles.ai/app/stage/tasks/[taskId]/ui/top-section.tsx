"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { Task } from "@giselles-ai/protocol";
import { FilePenLine } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export interface TopSectionData {
	task: Task;
	workspaceId: string;
}

export function TopSection({ data }: { data: Promise<TopSectionData> }) {
	const resolvedData = use(data);

	return (
		<div className="w-full border-b border-border pb-6">
			{/* App Summary Section */}
			<div>
				{/* Title placeholder */}
				<div className="flex items-center gap-3 mb-3">
					<h3 className="text-[18px] font-normal text-inverse">
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
								leftIcon={<FilePenLine className="stroke-[hsl(192,73%,84%)] stroke-[1.5] transition-colors group-hover:stroke-[hsl(192,73%,20%)]" />}
							>
								Edit in Studio
							</StatusBadge>
						</div>
					</Link>
				</div>
				{/* Description placeholder */}
				<p className="text-[14px] font-normal text-inverse">
					{/* App summary description will be displayed here */}
					App summary description will be displayed here.
				</p>
			</div>
		</div>
	);
}
