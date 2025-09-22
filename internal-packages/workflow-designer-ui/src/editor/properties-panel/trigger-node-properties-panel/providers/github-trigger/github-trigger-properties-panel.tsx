import {
	type FlowTriggerId,
	type GitHubFlowTriggerEvent,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle";
import {
	useFeatureFlag,
	useGiselleEngine,
	useIntegration,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { InfoIcon } from "lucide-react";
import {
	type FormEvent,
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import { Tooltip } from "../../../../../ui/tooltip";
import { isPromptEmpty as isEmpty } from "../../../../lib/validate-prompt";
import { SelectRepository } from "../../../ui";
import { GitHubTriggerConfiguredView } from "../../ui";
import { GitHubTriggerReconfiguringView } from "../../ui/reconfiguring-views/github-trigger-reconfiguring-view";
import { EventSelectionStep } from "./components/event-selection-step";
import { EventTypeDisplay } from "./components/event-type-display";
import { InstallGitHubApplication } from "./components/install-application";
import { LabelsInputStep } from "./components/labels-input-step";
import { RepositoryDisplay } from "./components/repository-display";
import { Unauthorized } from "./components/unauthorized";
import { createTriggerEvent } from "./utils/trigger-configuration";
import { useTriggerConfiguration } from "./utils/use-trigger-configuration";

export function GitHubTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { value } = useIntegration();
	if (value?.github === undefined) {
		return "unset";
	}

	if (node.content.state.status === "configured") {
		return (
			<GitHubTriggerConfiguredView
				flowTriggerId={node.content.state.flowTriggerId}
				node={node}
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

interface SelectEventStep {
	state: "select-event";
}

interface SelectRepositoryStep {
	state: "select-repository";
	eventId: GitHubTriggerEventId;
}

export interface InputCallsignStep {
	state: "input-callsign";
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
}

export interface InputLabelsStep {
	state: "input-labels";
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
}

interface ConfirmRepositoryStep {
	state: "confirm-repository";
	eventId: GitHubTriggerEventId;
	installationId: number;
	owner: string;
	repo: string;
	repoNodeId: string;
}

type GitHubTriggerSetupStep =
	| SelectEventStep
	| SelectRepositoryStep
	| InputCallsignStep
	| InputLabelsStep
	| ConfirmRepositoryStep;

/**
 * Determines if a trigger type requires a callsign
 */
function isTriggerRequiringCallsign(eventId: GitHubTriggerEventId): boolean {
	return [
		"github.issue_comment.created",
		"github.pull_request_comment.created",
		"github.pull_request_review_comment.created",
	].includes(eventId);
}

/**
 * Determines if a trigger type requires labels
 */
function isTriggerRequiringLabels(eventId: GitHubTriggerEventId) {
	return (
		eventId === "github.issue.labeled" ||
		eventId === "github.pull_request.labeled"
	);
}

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
	reconfigStep?: SelectRepositoryStep;
	flowTriggerId?: FlowTriggerId;
}) {
	const { experimental_storage } = useFeatureFlag();
	const [step, setStep] = useState<GitHubTriggerSetupStep>(
		reconfigStep ?? { state: "select-event" },
	);
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const { configureTrigger, isPending: isTriggerConfigPending } =
		useTriggerConfiguration({
			node,
		});
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const [eventId, setEventId] = useState<GitHubTriggerEventId>(
		reconfigStep?.eventId ?? "github.issue.created",
	);
	const [callsignError, setCallsignError] = useState<string | null>(null);
	const [labelsError, setLabelsError] = useState<string | null>(null);

	// Helper function to create callsign events
	const createCallsignEvent = useCallback(
		(
			eventId: GitHubTriggerEventId,
			formData: FormData,
		): GitHubFlowTriggerEvent => {
			const callsign = formData.get("callsign");
			if (typeof callsign !== "string" || isEmpty(callsign)) {
				throw new Error("Invalid callsign: expected a non-empty string.");
			}
			return {
				id: eventId,
				conditions: { callsign },
			} as GitHubFlowTriggerEvent;
		},
		[],
	);

	// Events that require callsign
	const CALLSIGN_EVENTS = [
		"github.issue_comment.created",
		"github.pull_request_comment.created",
		"github.pull_request_review_comment.created",
	] as const;

	const handleCallsignSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			setCallsignError(null);

			if (step.state !== "input-callsign") {
				throw new Error("Unexpected state");
			}

			let event: GitHubFlowTriggerEvent | undefined;
			const formData = new FormData(e.currentTarget);
			try {
				// Create event based on whether it requires callsign
				if (
					(CALLSIGN_EVENTS as readonly GitHubTriggerEventId[]).includes(eventId)
				) {
					event = createCallsignEvent(eventId, formData);
				} else {
					event = createTriggerEvent({ eventId });
				}

				if (event === undefined) {
					return;
				}
				configureTrigger(event, step);
			} catch (error) {
				setCallsignError(
					error instanceof Error ? error.message : "Invalid callsign",
				);
			}
		},
		[configureTrigger, step, eventId, CALLSIGN_EVENTS, createCallsignEvent],
	);

	const handleLabelsSubmit = useCallback(
		(
			e: FormEvent<HTMLFormElement>,
			rawLabels: { id: number; value: string }[],
		) => {
			e.preventDefault();
			setLabelsError(null);

			if (step.state !== "input-labels") {
				throw new Error("Unexpected state");
			}

			const validLabels = rawLabels
				.map((label) => label.value.trim())
				.filter((value) => value.length > 0);

			if (validLabels.length === 0) {
				setLabelsError("At least one label is required");
				return;
			}

			const event = createTriggerEvent({ eventId, labels: validLabels });
			configureTrigger(event, step);
		},
		[configureTrigger, step, eventId],
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
								});
							}}
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
								className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
								onClick={() => {
									setStep({
										state: "select-repository",
										eventId: step.eventId,
									});
								}}
								disabled={isPending}
							>
								<span className={isPending ? "opacity-0" : ""}>Back</span>
							</button>
							<button
								type="button"
								className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
								onClick={() => {
									if (
										isTriggerRequiringCallsign(step.eventId) &&
										node.content.state.status === "unconfigured"
									) {
										setStep({
											state: "input-callsign",
											eventId: step.eventId,
											installationId: step.installationId,
											owner: step.owner,
											repo: step.repo,
											repoNodeId: step.repoNodeId,
										});
									} else if (isTriggerRequiringLabels(step.eventId)) {
										setStep({
											state: "input-labels",
											eventId: step.eventId,
											installationId: step.installationId,
											owner: step.owner,
											repo: step.repo,
											repoNodeId: step.repoNodeId,
										});
									} else {
										startTransition(async () => {
											try {
												const trigger = githubTriggers[step.eventId];
												const outputs: Output[] = [];

												for (const key of trigger.event.payloads.keyof()
													.options) {
													outputs.push({
														id: OutputId.generate(),
														label: key,
														accessor: key,
													});
												}

												let triggerId: FlowTriggerId;
												if (
													node.content.state.status === "reconfiguring" &&
													flowTriggerId !== undefined
												) {
													const result = await client.reconfigureGitHubTrigger({
														flowTriggerId,
														repositoryNodeId: step.repoNodeId,
														installationId: step.installationId,
														useExperimentalStorage: experimental_storage,
													});
													triggerId = result.triggerId;
												} else {
													const event = createTriggerEvent({
														eventId: step.eventId,
													});
													const result = await client.configureTrigger({
														trigger: {
															nodeId: node.id,
															workspaceId: workspace?.id,
															enable: false,
															configuration: {
																provider: "github",
																repositoryNodeId: step.repoNodeId,
																installationId: step.installationId,
																event,
															},
														},
														useExperimentalStorage: experimental_storage,
													});
													triggerId = result.triggerId;
												}

												updateNodeData(node, {
													content: {
														...node.content,
														state: {
															status: "configured",
															flowTriggerId: triggerId,
														},
													},
													outputs:
														node.outputs.length > 0 ? node.outputs : outputs,
													name: node.name ?? `On ${trigger.event.label}`,
												});
											} catch (_error) {
												// Error is handled by the UI state
											}
										});
									}
								}}
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
											className="animate-spin h-5 w-5 text-white"
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
					onSubmit={handleCallsignSubmit}
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
									callsignError
										? "border border-red-500 focus:border-red-400"
										: "border border-white-400 focus:border-white-900",
									"text-[14px] bg-transparent",
								)}
								placeholder="code-review"
							/>
						</div>
						{callsignError ? (
							<p className="text-[12px] text-red-400 pl-2">{callsignError}</p>
						) : (
							<p className="text-[12px] text-white-400 pl-2">
								A callsign is required for issue comment triggers. Examples:
								/code-review, /check-policy
							</p>
						)}
					</fieldset>

					<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px]">
						<button
							type="button"
							className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
							onClick={() => {
								setCallsignError(null);
								setStep({
									state: "select-repository",
									eventId: step.eventId,
								});
							}}
							disabled={isTriggerConfigPending}
						>
							<span className={isTriggerConfigPending ? "opacity-0" : ""}>
								Back
							</span>
						</button>
						<button
							type="submit"
							className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
							disabled={isTriggerConfigPending}
						>
							<span className={isTriggerConfigPending ? "opacity-0" : ""}>
								{isTriggerConfigPending ? "Setting up..." : "Set Up"}
							</span>
							{isTriggerConfigPending && (
								<span className="absolute inset-0 flex items-center justify-center">
									<svg
										className="animate-spin h-5 w-5 text-white"
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
					onBack={() => {
						setLabelsError(null);
						setStep({
							state: "select-repository",
							eventId: step.eventId,
						});
					}}
					onSubmit={handleLabelsSubmit}
					isPending={isTriggerConfigPending}
					labelsError={labelsError}
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
