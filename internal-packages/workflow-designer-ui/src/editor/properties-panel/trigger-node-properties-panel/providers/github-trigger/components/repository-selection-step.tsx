import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle-engine";

import { useCallback, useState } from "react";
import { SelectRepository } from "../../../../ui";
import { GitHubRepositoryBlock } from "../../../ui/common/repository-block";
import { isTriggerRequiringCallsign } from "../utils/trigger-configuration";
import { ActionButtons, FieldDisplay, ScrollableContainer } from "./common";

interface RepositorySelectionStepProps {
	installations: GitHubIntegrationInstallation[];
	installationUrl: string;
	eventId: GitHubTriggerEventId;
	onBack: () => void;
	onContinue: (params: {
		eventId: GitHubTriggerEventId;
		installationId: number;
		owner: string;
		repo: string;
		repoNodeId: string;
		requiresCallsign: boolean;
	}) => void;
	/** このコンポーネントが通常のフロー用かテスト用か */
	isForTest?: boolean;
	defaultInstallationId?: number;
	defaultOwner?: string;
	defaultRepo?: string;
	defaultRepoNodeId?: string;
}

export function RepositorySelectionStep({
	installations,
	installationUrl,
	eventId,
	onBack,
	onContinue,
	defaultInstallationId,
	defaultOwner,
	defaultRepo,
	defaultRepoNodeId,
}: RepositorySelectionStepProps) {
	const [selectedInstallationId, setSelectedInstallationId] = useState<
		number | null
	>(defaultInstallationId || null);
	const [selectedRepository, setSelectedRepository] = useState<{
		owner: string;
		repo: string;
		repoNodeId: string;
	} | null>(
		defaultOwner && defaultRepo && defaultRepoNodeId
			? {
					owner: defaultOwner,
					repo: defaultRepo,
					repoNodeId: defaultRepoNodeId,
				}
			: null,
	);

	// Handle repository selection
	const handleSelectRepository = useCallback(
		(value: {
			installationId: number;
			owner: string;
			repo: string;
			repoNodeId: string;
		}) => {
			setSelectedRepository({
				owner: value.owner,
				repo: value.repo,
				repoNodeId: value.repoNodeId,
			});
			setSelectedInstallationId(value.installationId);
		},
		[],
	);

	return (
		<ScrollableContainer className="flex-1 pr-2 h-full relative">
			<div className="flex flex-col gap-[16px]">
				<FieldDisplay label="Event Type">
					<div className="flex items-center rounded-lg w-full h-[36px]">
						<div className="p-2 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center">
							{/* Icon for the event type would be rendered here */}
							<span className="text-white-800 font-medium text-[14px]">
								{githubTriggers[eventId].event.label}
							</span>
						</div>
					</div>
				</FieldDisplay>

				<FieldDisplay label="Organization">
					<SelectRepository
						installations={installations}
						installationUrl={installationUrl}
						onSelectRepository={(value, _setLoading) => {
							handleSelectRepository(value);
						}}
					/>
				</FieldDisplay>

				{/* Repository information display if selected */}
				{selectedRepository && (
					<FieldDisplay label="Repository" applyContentPadding={false}>
						<GitHubRepositoryBlock
							owner={selectedRepository.owner}
							repo={selectedRepository.repo}
						/>
					</FieldDisplay>
				)}

				{/* Action buttons */}
				{selectedRepository && (
					<ActionButtons
						onBack={onBack}
						onPrimary={() => {
							if (!selectedInstallationId || !selectedRepository) return;

							const requiresCallsign = isTriggerRequiringCallsign(eventId);

							onContinue({
								eventId,
								installationId: selectedInstallationId,
								owner: selectedRepository.owner,
								repo: selectedRepository.repo,
								repoNodeId: selectedRepository.repoNodeId,
								requiresCallsign,
							});
						}}
						primaryButtonText={
							isTriggerRequiringCallsign(eventId) ? "Continue" : "Set Up"
						}
					/>
				)}
			</div>
		</ScrollableContainer>
	);
}
