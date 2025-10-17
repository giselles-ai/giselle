import type { FlowTriggerId, TriggerNode } from "@giselle-sdk/data-type";
import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle";
import { useIntegration } from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { InfoIcon } from "lucide-react";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { Tooltip } from "../../../../../ui/tooltip";
import { SelectRepository } from "../../../ui";
import {
	GitHubTriggerConfiguredView,
	type GitHubTriggerReconfigureMode,
} from "../../ui";
import { GitHubTriggerReconfiguringView } from "../../ui/reconfiguring-views/github-trigger-reconfiguring-view";
import { EventSelectionStep } from "./components/event-selection-step";
import { EventTypeDisplay } from "./components/event-type-display";
import { InstallGitHubApplication } from "./components/install-application";
import { LabelsInputStep } from "./components/labels-input-step";
import { RepositoryDisplay } from "./components/repository-display";
import { Unauthorized } from "./components/unauthorized";
import {
	type GitHubTriggerSetupStep,
	resolveNextStep,
} from "./utils/resolve-next-step";
import {
	isTriggerRequiringCallsign,
	isTriggerRequiringLabels,
} from "./utils/trigger-configuration";
import { useConfigureTrigger } from "./utils/use-configure-trigger";

export function GitHubTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { value } = useIntegration();
	const reconfigureModeRef = useRef<GitHubTriggerReconfigureMode | undefined>(
		undefined,
	);
	if (value?.github === undefined) {
		return "unset";
	}

	if (node.content.state.status === "configured") {
		return (
			<GitHubTriggerConfiguredView
				flowTriggerId={node.content.state.flowTriggerId}
				node={node}
				onStartReconfigure={(mode) => {
					reconfigureModeRef.current = mode;
				}}
			/>
		);
	} else if (
		node.content.state.status === "reconfiguring" &&
		value.github.status === "installed"
	) {
		return (
			<GitHubTriggerReconfiguringView
				installations={value.github.installations}
				node={node}
				installationUrl={value.github.installationUrl}
				flowTriggerId={node.content.state.flowTriggerId}
				reconfigureMode={reconfigureModeRef.current}
			/>
		);
	}

	switch (value.github.status) {
		case "unset":
			return "unset";
		case "unauthorized":
			return <Unauthorized authUrl={value.github.authUrl} />;
		case "not-installed":
			return (
				<InstallGitHubApplication
					installationUrl={value.github.installationUrl}
				/>
			);
		case "invalid-credential":
			return "invalid-credential";
		case "installed":
			return (
				<Installed
					installations={value.github.installations}
					node={node}
					installationUrl={value.github.installationUrl}
				/>
			);
		case "error":
			return `GitHub integration error: ${value.github.errorMessage}`;
		default: {
			const _exhaustiveCheck: never = value.github;
			throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
		}
	}
}

const DEFAULT_EVENT_ID = "github.issue.created";

export function Installed({
	installations,
	node,
	installationUrl,
	reconfigStep,
	flowTriggerId,
}: {
	installations: GitHubIntegrationInstallation[];
	node: TriggerNode;
	installationUrl: string;
	reconfigStep?: GitHubTriggerSetupStep;
	flowTriggerId?: FlowTriggerId;
}) {
	const [step, setStep] = useState<GitHubTriggerSetupStep>(
		reconfigStep ?? { state: "select-event", eventId: DEFAULT_EVENT_ID },
	);
	const [eventId, setEventId] = useState<GitHubTriggerEventId>(
		reconfigStep?.eventId ?? DEFAULT_EVENT_ID,
	);
	const isReconfiguring = node.content.state.status === "reconfiguring";
	const { configureTrigger, isPending } = useConfigureTrigger({ node });

	const handleSubmit = useCallback(
		(data?: { callsign?: string; labels?: string[] }) => {
			try {
				const action = resolveNextStep({
					currentStep: step,
					eventId,
					submissionData: data ?? {},
					nodeStatus: node.content.state.status,
				});

				if (action.type === "continue") {
					setStep(action.nextStep);
				} else if (action.type === "submit") {
					configureTrigger({
						event: action.event,
						repositoryInfo: action.repositoryInfo,
						flowTriggerId,
					});
				}
			} catch (error) {
				console.error(error);
			}
		},
		[step, eventId, node.content.state.status, configureTrigger, flowTriggerId],
	);

	const handleCallsignSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const callsign = new FormData(e.currentTarget).get("callsign");
			if (typeof callsign !== "string") return;
			const normalizedCallsign = callsign.trim();
			if (normalizedCallsign.length === 0) {
				return;
			}
			handleSubmit({ callsign: normalizedCallsign });
		},
		[handleSubmit],
	);

	const handleLabelsSubmit = useCallback(
		(
			e: FormEvent<HTMLFormElement>,
			rawLabels: { id: number; value: string }[],
		) => {
			e.preventDefault();
			const labels = rawLabels
				.map((label) => label.value.trim())
				.filter((value) => value.length > 0);
			handleSubmit({ labels });
		},
		[handleSubmit],
	);

	return (
		<div className="flex flex-col gap-[8px] h-full px-1">
			{step.state === "select-event" && (
				<EventSelectionStep
					selectedEventId={eventId}
					onSelectEvent={(id) => {
						setEventId(id);
						setStep({
							state: "select-repository",
							eventId: id,
						});
					}}
				/>
			)}

			{step.state === "select-repository" && (
				<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
					<p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
					<EventTypeDisplay
						eventId={step.eventId}
						className="mb-4"
						showDescription={false}
					/>

					<p className="text-[14px] text-[#F7F9FD] mb-3">Organization</p>
					<div className="px-[4px] py-[4px]">
						<SelectRepository
							installations={installations}
							installationUrl={installationUrl}
							onSelectRepository={(value) => {
								setStep({
									state: "confirm-repository",
									eventId: step.eventId,
									installationId: value.installationId,
									owner: value.owner,
									repo: value.repo,
									repoNodeId: value.repoNodeId,
									callsign: step.callsign,
									labels: step.labels,
								});
							}}
							initialInstallationId={step.installationId}
						/>
					</div>
				</div>
			)}

			{step.state === "confirm-repository" && (
				<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
					<div className="flex flex-col gap-[8px]">
						<p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
						<EventTypeDisplay eventId={step.eventId} showDescription={false} />
						<p className="text-[14px] text-[#F7F9FD] mb-2 mt-4">Repository</p>
						<RepositoryDisplay
							owner={step.owner}
							repo={step.repo}
							className="mb-2"
						/>

						<div className="flex gap-[8px] mt-[12px] px-[4px]">
							<button
								type="button"
								className="flex-1 bg-bg-700 hover:bg-bg-600 text-inverse font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
								onClick={() => {
									setStep({
										state: "select-repository",
										eventId: step.eventId,
										callsign: step.callsign,
										labels: step.labels,
										installationId: step.installationId,
									});
								}}
								disabled={isPending}
							>
								<span className={isPending ? "opacity-0" : ""}>Back</span>
							</button>
							<button
								type="button"
								className="flex-1 bg-primary-900 hover:bg-primary-800 text-inverse font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
								onClick={() => {
									handleSubmit();
								}}
								disabled={isPending}
							>
								<span className={isPending ? "opacity-0" : ""}>
									{isTriggerRequiringCallsign(step.eventId) ||
									isTriggerRequiringLabels(step.eventId)
										? "Continue"
										: "Set Up"}
								</span>
								{isPending && (
									<span className="absolute inset-0 flex items-center justify-center">
										<svg
											className="animate-spin h-5 w-5 text-inverse"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											aria-label="Loading"
										>
											<title>Loading</title>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									</span>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{step.state === "input-callsign" && (
				<form
					className="w-full flex flex-col gap-[8px] overflow-y-auto flex-1 pr-2 custom-scrollbar"
					onSubmit={(e) => {
						handleCallsignSubmit(e);
					}}
				>
					<p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
					<EventTypeDisplay eventId={step.eventId} showDescription={false} />
					<p className="text-[14px] text-[#F7F9FD] mb-2 mt-4">Repository</p>
					<RepositoryDisplay
						owner={step.owner}
						repo={step.repo}
						className="mb-2"
					/>

					<fieldset className="flex flex-col gap-[8px]">
						<div className="flex items-center gap-[4px] px-[4px]">
							<p className="text-[14px] text-[#F7F9FD]">Callsign</p>
							<Tooltip
								text={
									<p className="w-[260px]">
										Only comments starting with this callsign will trigger the
										workflow, preventing unnecessary executions from unrelated
										comments.
									</p>
								}
							>
								<button type="button">
									<InfoIcon className="size-[16px]" />
								</button>
							</Tooltip>
						</div>
						<div className="relative px-[4px]">
							<div className="absolute inset-y-0 left-[16px] flex items-center pointer-events-none">
								<span className="text-[14px]">/</span>
							</div>
							<input
								type="text"
								name="callsign"
								className={clsx(
									"group w-full flex justify-between items-center rounded-[8px] py-[8px] pl-[28px] pr-[4px] outline-none focus:outline-none",
									"border border-white-400 focus:border-border",
									"text-[14px] bg-transparent",
								)}
								defaultValue={step.callsign ?? ""}
								required={true}
								placeholder="code-review"
							/>
						</div>
						<p className="text-[12px] text-inverse pl-2">
							A callsign is required for issue comment triggers. Examples:
							/code-review, /check-policy
						</p>
					</fieldset>

					<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px]">
						{!isReconfiguring && (
							<button
								type="button"
								className="flex-1 bg-bg-700 hover:bg-bg-600 text-inverse font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
								onClick={() => {
									setStep({
										state: "confirm-repository",
										eventId: step.eventId,
										installationId: step.installationId,
										owner: step.owner,
										repo: step.repo,
										repoNodeId: step.repoNodeId,
										callsign: step.callsign,
									});
								}}
								disabled={isPending}
							>
								<span className={isPending ? "opacity-0" : ""}>Back</span>
							</button>
						)}
						<button
							type="submit"
							className={clsx(
								"bg-primary-900 hover:bg-primary-800 text-inverse font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative",
								isReconfiguring ? "w-full" : "flex-1",
							)}
							disabled={isPending}
						>
							<span className={isPending ? "opacity-0" : ""}>
								{isPending ? "Setting up..." : "Set Up"}
							</span>
							{isPending && (
								<span className="absolute inset-0 flex items-center justify-center">
									<svg
										className="animate-spin h-5 w-5 text-inverse"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										aria-label="Loading"
									>
										<title>Loading</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								</span>
							)}
						</button>
					</div>
				</form>
			)}

			{step.state === "input-labels" && (
				<LabelsInputStep
					eventId={step.eventId}
					owner={step.owner}
					repo={step.repo}
					initialLabels={step.labels}
					onBack={() => {
						setStep({
							state: "confirm-repository",
							eventId: step.eventId,
							installationId: step.installationId,
							owner: step.owner,
							repo: step.repo,
							repoNodeId: step.repoNodeId,
							labels: step.labels,
							callsign: step.callsign,
						});
					}}
					onSubmit={handleLabelsSubmit}
					isPending={isPending}
					showBackButton={!isReconfiguring}
				/>
			)}

			<style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
      `}</style>
		</div>
	);
}
