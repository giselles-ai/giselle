import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import { githubTriggers } from "@giselle-sdk/flow";
import { GitHubRepositoryBlock } from "../../../ui/common/repository-block";
import { isTriggerRequiringCallsign } from "../utils/trigger-configuration";
import { ActionButtons, FieldDisplay, ScrollableContainer } from "./common";
import { getTriggerIcon } from "./icons";

interface ConfirmRepositoryStepProps {
	eventId: GitHubTriggerEventId;
	installationId: number;
	owner: string;
	repo: string;
	repoNodeId: string;
	onBack: () => void;
	onSetup: (params: {
		eventId: GitHubTriggerEventId;
		installationId: number;
		owner: string;
		repo: string;
		repoNodeId: string;
		requiresCallsign: boolean;
	}) => void;
}

export function ConfirmRepositoryStep({
	eventId,
	installationId,
	owner,
	repo,
	repoNodeId,
	onBack,
	onSetup,
}: ConfirmRepositoryStepProps) {
	const requiresCallsign = isTriggerRequiringCallsign(eventId);
	const triggerInfo = githubTriggers[eventId];

	return (
		<ScrollableContainer className="flex-1 pr-2 h-full relative">
			<div className="flex flex-col gap-[16px]">
				<FieldDisplay label="Event Type">
					<div className="w-full bg-transparent text-[14px] flex items-center">
						<div className="p-2 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center">
							{getTriggerIcon(eventId)}
						</div>
						<div className="flex flex-col min-w-0">
							<span className="text-white-800 font-medium text-[14px] truncate">
								{triggerInfo.event.label}
							</span>
							<span className="text-white-400 text-[12px] truncate">
								Trigger when {triggerInfo.event.label.toLowerCase()} in your
								repository
							</span>
						</div>
					</div>
				</FieldDisplay>

				<FieldDisplay label="Repository" applyContentPadding={false}>
					<div className="flex items-center">
						<GitHubRepositoryBlock owner={owner} repo={repo} />
					</div>
				</FieldDisplay>

				<ActionButtons
					onBack={onBack}
					onPrimary={() => {
						onSetup({
							eventId,
							installationId,
							owner,
							repo,
							repoNodeId,
							requiresCallsign,
						});
					}}
					primaryButtonText={requiresCallsign ? "Continue" : "Set Up"}
				/>
			</div>
		</ScrollableContainer>
	);
}
