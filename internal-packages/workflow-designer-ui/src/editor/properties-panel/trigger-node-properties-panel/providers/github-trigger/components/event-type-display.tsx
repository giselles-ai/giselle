import {
	type GitHubEventId,
	githubEvents,
} from "@giselles-ai/trigger-registry";
import clsx from "clsx/lite";
import { getTriggerIcon } from "./icons";

interface EventTypeDisplayProps {
	eventId: GitHubEventId;
	className?: string;
	showDescription?: boolean;
}

export function EventTypeDisplay({
	eventId,
	className,
	showDescription = true,
}: EventTypeDisplayProps) {
	const triggerRegistry = githubEvents[eventId];

	return (
		<div className={clsx("flex flex-col gap-1", className)}>
			<div className="flex items-center gap-2">
				{getTriggerIcon(eventId)}
				<span className="text-sm font-medium text-inverse">
					{triggerRegistry.label}
				</span>
			</div>
			{showDescription && (
				<p className="text-xs text-gray-400 ml-4">
					Triggers when a {triggerRegistry.label.toLowerCase()} occurs in the
					repository
				</p>
			)}
		</div>
	);
}
