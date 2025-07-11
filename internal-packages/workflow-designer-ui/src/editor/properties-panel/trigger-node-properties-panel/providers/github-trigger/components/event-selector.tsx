import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import { memo, useCallback, useMemo } from "react";
import { ArrowRightIcon, getTriggerIcon } from "./icons";

export interface EventSelectorProps {
	/**
	 * Callback when an event is selected
	 */
	onSelectEvent: (eventId: GitHubTriggerEventId) => void;

	/**
	 * Optional currently selected event ID
	 */
	selectedEventId?: GitHubTriggerEventId;

	/**
	 * Optional title for the section
	 */
	title?: string;

	/**
	 * Optional className for additional styling
	 */
	className?: string;
}

/**
 * Component for selecting a GitHub trigger event type
 */
function EventSelectorComponent({
	onSelectEvent,
	selectedEventId,
	title = "Event Type",
	className = "",
}: EventSelectorProps) {
	// Memoize the event entries to prevent unnecessary re-renders
	const triggerEntries = useMemo(() => Object.entries(githubTriggers), []);

	// Memoize the click handler for each event
	const handleEventClick = useCallback(
		(id: string) => {
			onSelectEvent(id as GitHubTriggerEventId);
		},
		[onSelectEvent],
	);

	return (
		<div
			className={`w-full flex flex-col gap-[4px] flex-1 overflow-hidden ${className}`}
		>
			<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">{title}</p>
			<div className="flex flex-col gap-[20px] overflow-y-auto pr-2 pt-[12px] custom-scrollbar flex-1">
				{triggerEntries.map(([id, githubTrigger]) => {
					const isSelected = selectedEventId === id;
					return (
						<button
							key={id}
							type="button"
							className={`flex items-center py-0 px-0 rounded-lg group w-full h-[36px] ${
								isSelected ? "bg-black-700 border border-white-700" : ""
							}`}
							onClick={() => handleEventClick(id)}
						>
							<div className="flex items-center min-w-0 flex-1">
								<div
									className={`p-2 rounded-lg mr-3 transition-colors flex-shrink-0 flex items-center justify-center ${
										isSelected
											? "bg-white/20"
											: "bg-white/10 group-hover:bg-white/20"
									}`}
								>
									{getTriggerIcon(id as GitHubTriggerEventId)}
								</div>
								<div className="flex flex-col text-left overflow-hidden min-w-0">
									<span className="text-white-800 font-medium text-[14px] truncate">
										{githubTrigger.event.label}
									</span>
									<span className="text-white-400 text-[12px] truncate group-hover:text-white-300 transition-colors">
										{`Trigger when ${githubTrigger.event.label.toLowerCase()} in your repository`}
									</span>
								</div>
							</div>
							<ArrowRightIcon />
						</button>
					);
				})}
			</div>
		</div>
	);
}

// Memoize the component to prevent unnecessary re-renders
export const EventSelector = memo(EventSelectorComponent);

/**
 * Determines if a trigger type requires a callsign
 */
export function isTriggerRequiringCallsign(
	eventId: GitHubTriggerEventId,
): boolean {
	return [
		"github.issue_comment.created",
		"github.pull_request_comment.created",
		"github.pull_request_review_comment.created",
	].includes(eventId);
}
