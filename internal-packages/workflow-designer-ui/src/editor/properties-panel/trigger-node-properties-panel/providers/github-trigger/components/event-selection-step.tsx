import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { type GitHubTriggerEventId, githubTriggers } from "@giselles-ai/flow";
import { getTriggerIcon } from "./icons";

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
			<SettingLabel className="mb-[4px]">Event Type</SettingLabel>
			<div className="flex flex-col gap-[8px] overflow-y-auto pr-2 pl-0 pt-[8px] custom-scrollbar flex-1">
				{Object.entries(githubTriggers).map(([id, githubTrigger]) => (
					<button
						key={id}
						type="button"
						className="flex items-center py-[8px] px-[8px] rounded-lg group w-full min-h-[48px] border border-inverse/20 hover:border-inverse/30 hover:bg-inverse/10 transition-colors"
						onClick={() => onSelectEvent(id as GitHubTriggerEventId)}
					>
						<div className="flex items-center min-w-0 flex-1">
							<div className="p-2 rounded-lg mr-3 bg-bg/10 group-hover:bg-bg/20 transition-colors flex-shrink-0 flex items-center justify-center">
								{getTriggerIcon(id as GitHubTriggerEventId)}
							</div>
							<div className="flex flex-col text-left overflow-hidden min-w-0">
								<span className="text-inverse font-medium text-[14px] truncate">
									{githubTrigger.event.label}
								</span>
								<span className="text-text-muted text-[10px] truncate group-hover:text-inverse transition-colors pr-6">
									{`Trigger when ${githubTrigger.event.label.toLowerCase()} in your repository`}
								</span>
							</div>
						</div>
						{/* Removed right arrow icon for cleaner list item */}
					</button>
				))}
			</div>
		</div>
	);
}
