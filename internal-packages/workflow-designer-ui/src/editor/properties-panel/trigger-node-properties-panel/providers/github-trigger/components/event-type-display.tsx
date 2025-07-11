import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import { githubTriggers } from "@giselle-sdk/flow";
import clsx from "clsx/lite";

interface EventTypeDisplayProps {
	eventId: GitHubTriggerEventId;
	className?: string;
	showDescription?: boolean;
}

export function EventTypeDisplay({
	eventId,
	className,
	showDescription = true,
}: EventTypeDisplayProps) {
	const trigger = githubTriggers[eventId];

	if (!trigger) {
		return null;
	}

	return (
		<div className={clsx("flex flex-col gap-1", className)}>
			<div className="flex items-center gap-2">
				<div className="w-2 h-2 bg-blue-500 rounded-full" />
				<span className="text-sm font-medium text-white">
					{trigger.event.label}
				</span>
			</div>
			{showDescription && (
				<p className="text-xs text-gray-400 ml-4">
					Triggers when a {trigger.event.label.toLowerCase()} occurs in the
					repository
				</p>
			)}
		</div>
	);
}
