import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import clsx from "clsx/lite";
import { useMemo } from "react";
import { ArrowRightIcon, getTriggerIcon } from "./icons";

interface EventSelectionStepProps {
	selectedEventId?: GitHubTriggerEventId;
	callsign?: string;
	onSelectEvent: (eventId: GitHubTriggerEventId) => void;
	onCallsignChange: (value: string) => void;
	onContinue: () => void;
	onUseAsTemplate: () => void;
	canContinue: boolean;
}

const CALLSIGN_EVENTS: readonly GitHubTriggerEventId[] = [
	"github.issue_comment.created",
	"github.pull_request_comment.created",
	"github.pull_request_review_comment.created",
];

export function EventSelectionStep({
	selectedEventId,
	callsign,
	onSelectEvent,
	onCallsignChange,
	onContinue,
	onUseAsTemplate,
	canContinue,
}: EventSelectionStepProps) {
	const requiresCallsign = useMemo(
		() =>
			selectedEventId !== undefined &&
			CALLSIGN_EVENTS.includes(selectedEventId),
		[selectedEventId],
	);
	const isValid =
		selectedEventId !== undefined &&
		(!requiresCallsign || (callsign && callsign.length > 0));
	return (
		<div className="flex flex-col gap-[8px] flex-1 overflow-hidden">
			<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Event Type</p>
			<div className="flex flex-col gap-[16px] overflow-y-auto pr-2 pl-0 pt-[8px] custom-scrollbar flex-1">
				{Object.entries(githubTriggers).map(([id, githubTrigger]) => (
					<button
						key={id}
						type="button"
						className={clsx(
							"flex items-center py-[12px] px-[8px] rounded-lg group w-full h-[48px]",
							selectedEventId === (id as GitHubTriggerEventId)
								? "bg-white/10"
								: undefined,
						)}
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
			{requiresCallsign && (
				<input
					className="bg-black-700 text-white rounded-md p-2 text-sm"
					placeholder="Callsign"
					value={callsign ?? ""}
					onChange={(e) => onCallsignChange(e.target.value)}
				/>
			)}
			<div className="flex gap-2">
				<button
					type="button"
					className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50"
					onClick={onContinue}
					disabled={!isValid || !canContinue}
				>
					Continue to repository
				</button>
				<button
					type="button"
					className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50"
					onClick={onUseAsTemplate}
					disabled={!isValid}
				>
					Use as template
				</button>
			</div>
		</div>
	);
}
