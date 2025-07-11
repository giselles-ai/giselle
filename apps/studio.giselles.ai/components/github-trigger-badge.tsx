"use client";

import { cn } from "@/lib/utils";

interface GitHubTriggerBadgeProps {
	label: string;
	isNew?: boolean;
	className?: string;
}

/**
 * A simple badge component for GitHub triggers with optional "NEW" indicator
 */
export function GitHubTriggerBadge({
	label,
	isNew = false,
	className,
}: GitHubTriggerBadgeProps) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			{isNew && (
				<span className="inline-flex items-center justify-center rounded-sm border border-white/30 px-1 py-0.5 text-[10px] font-semibold uppercase leading-none text-white bg-transparent">
					NEW
				</span>
			)}
			<span className="text-sm font-medium text-white">{label}</span>
		</div>
	);
}

export default GitHubTriggerBadge;
