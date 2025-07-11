import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import { ArrowRightIcon, getTriggerIcon } from "./icons";

interface EventSelectionStepProps {
	/**
	 * The currently selected event ID (if any)
	 */
	selectedEventId?: GitHubTriggerEventId;

	/**
	 * Callback when an event is selected
	 */
	onSelectEvent: (eventId: GitHubTriggerEventId) => void;
}

/**
 * The first step in GitHub trigger setup - allows selecting the event type
 */
export function EventSelectionStep({ onSelectEvent }: EventSelectionStepProps) {
	return (
		<div className="flex flex-col gap-[4px] flex-1 overflow-hidden">
			<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Event Type</p>
			<div className="flex flex-col gap-[16px] overflow-y-auto pr-2 pl-0 pt-[8px] custom-scrollbar flex-1">
				{Object.entries(githubTriggers).map(([id, githubTrigger]) => (
					<button
						key={id}
						type="button"
						className="flex items-center py-[12px] px-[8px] rounded-lg group w-full h-[48px]"
						onClick={() => onSelectEvent(id as GitHubTriggerEventId)}
					>
						<div className="flex items-center min-w-0 flex-1">
							<div className="p-2 rounded-lg mr-3 bg-white/10 group-hover:bg-white/20 transition-colors flex-shrink-0 flex items-center justify-center">
								{getTriggerIcon(id as GitHubTriggerEventId)}
							</div>
							<div className="flex flex-col text-left overflow-hidden min-w-0">
								<span className="text-white-800 font-medium text-[14px] truncate">
									{githubTrigger.event.label}
								</span>
								<span className="text-white-400 text-[12px] truncate group-hover:text-white-300 transition-colors pr-6">
									{`Trigger when ${githubTrigger.event.label.toLowerCase()} in your repository`}
								</span>
							</div>
						</div>
						<ArrowRightIcon />
					</button>
				))}
			</div>
		</div>
	);
}
