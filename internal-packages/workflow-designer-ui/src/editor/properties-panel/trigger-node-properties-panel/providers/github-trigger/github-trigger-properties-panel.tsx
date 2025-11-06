import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import type { GitHubIntegrationInstallation } from "@giselles-ai/giselle";
import {
	useGiselleEngine,
	useIntegration,
	useWorkflowDesigner,
} from "@giselles-ai/giselle/react";
import {
	type GitHubTriggerEventId,
	type Output,
	OutputId,
	type TriggerId,
	type TriggerNode,
} from "@giselles-ai/protocol";
import { findGitHubTriggerOption } from "@giselles-ai/trigger-registry";
import clsx from "clsx/lite";
import { ChevronLeft, InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	type FormEvent,
	type FormEventHandler,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { Tooltip } from "../../../../../ui/tooltip";
import { isPromptEmpty as isEmpty } from "../../../../lib/validate-prompt";
import { SelectRepository } from "../../../ui";
import { usePanelScrollMode } from "../../index";
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

export type GitHubTriggerReconfigureMode = "repository" | "callsign" | "labels";

// Reused class names (keep UI the same while reducing duplication)
const BACK_LINK_CLASS =
	"inline-flex items-center gap-[6px] text-text-muted hover:text-text underline text-[12px] mb-[8px]";
const HELP_TEXT_P_CLASS = "text-inverse text-[12px] text-right mb-3 w-full";
const HELP_LINK_CLASS =
	"text-inverse hover:text-inverse ml-1 underline text-[12px]";

function BackLink({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={BACK_LINK_CLASS}
			aria-label="Back"
		>
			<ChevronLeft className="w-[14px] h-[14px]" />
			Back
		</button>
	);
}

function MissingAccountLink({ href }: { href: string }) {
	return (
		<p className={HELP_TEXT_P_CLASS}>
			Missing GitHub account?
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={HELP_LINK_CLASS}
			>
				Adjust GitHub App Permissions
			</a>
		</p>
	);
}

function SectionTitle({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<p className={clsx("text-[14px] text-inverse", className)}>{children}</p>
	);
}

function LabeledRow({
	label,
	right,
	className,
}: {
	label: ReactNode;
	right?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={clsx(
				"flex w-full items-center justify-between gap-[12px]",
				className,
			)}
		>
			<div className="shrink-0 w-[120px]">
				<SettingDetail className="mb-0">{label}</SettingDetail>
			</div>
			<div className="grow min-w-0 flex justify-end">{right}</div>
		</div>
	);
}

type RepositoryItem = {
	node_id: string;
	name: string;
	private: boolean;
	owner: { login: string };
};

function RepositoryItemButton({
	repo,
	onClick,
}: {
	repo: RepositoryItem;
	onClick: () => void;
}) {
	return (
		<button
			key={repo.node_id}
			type="button"
			className="group relative rounded-[12px] overflow-hidden px-[16px] py-[12px] w-full border-[0.5px] border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.15)] hover:border-white/12 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.2)] transition-all duration-200 cursor-pointer text-left"
			onClick={onClick}
		>
			<div className="invisible group-hover:visible absolute right-4 top-1/2 transform -translate-y-1/2 bg-bg-800 text-inverse text-xs px-2 py-1 rounded whitespace-nowrap">
				Select
			</div>
			<div className="flex items-center justify-between">
				<div className="flex flex-col">
					<div className="flex items-center gap-2">
						<span className="text-inverse font-medium text-[14px]">
							{repo.name}
						</span>
						<span className="rounded-full px-1.5 py-px text-text/60 font-medium text-[10px] leading-normal font-geist border-[0.5px] border-border/40">
							{repo.private ? "Private" : "Public"}
						</span>
					</div>
				</div>
			</div>
		</button>
	);
}

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
				triggerId={node.content.state.flowTriggerId}
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
				triggerId={node.content.state.flowTriggerId}
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
	callsign?: string;
}

export interface InputLabelsStep {
	state: "input-labels";
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
	labels?: string[];
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
		"github.discussion_comment.created",
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
	triggerId,
}: {
	installations: GitHubIntegrationInstallation[];
	node: TriggerNode;
	installationUrl: string;
	reconfigStep?: SelectRepositoryStep | InputCallsignStep | InputLabelsStep;
	triggerId?: TriggerId;
}) {
	const isReconfiguring = node.content.state.status === "reconfiguring";
	const [step, setStep] = useState<GitHubTriggerSetupStep>(
		reconfigStep ?? { state: "select-event" },
	);
	const [selectedInstallationId, setSelectedInstallationId] = useState<
		number | null
	>(null);
	useEffect(() => {
		if (step.state === "select-repository") {
			setSelectedInstallationId(null);
		}
	}, [step.state]);
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const selectedInstallationRepositories = useMemo(
		() =>
			(selectedInstallationId === null
				? []
				: installations.find((i) => i.id === selectedInstallationId)
						?.repositories) ?? [],
		[installations, selectedInstallationId],
	);
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

	const handleCallsignSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			setCallsignError(null);

			if (step.state !== "input-callsign") {
				throw new Error("Unexpected state");
			}

			const formData = new FormData(e.currentTarget);
			try {
				const callsign = formData.get("callsign");
				if (typeof callsign !== "string" || isEmpty(callsign)) {
					throw new Error("Invalid callsign: expected a non-empty string.");
				}

				const event = createTriggerEvent({ eventId, callsign });

				startTransition(async () => {
					if (isReconfiguring && triggerId !== undefined) {
						try {
							await client.reconfigureGitHubTrigger({
								triggerId,
								repositoryNodeId: step.repoNodeId,
								installationId: step.installationId,
								event,
							});

							updateNodeData(node, {
								content: {
									...node.content,
									state: {
										status: "configured",
										flowTriggerId: triggerId,
									},
								},
							});
						} catch (_error) {
							// Error is handled by the UI state
						}
					} else {
						configureTrigger(event, step);
					}
				});
			} catch (error) {
				setCallsignError(
					error instanceof Error ? error.message : "Invalid callsign",
				);
			}
		},
		[
			step,
			eventId,
			isReconfiguring,
			node,
			triggerId,
			client,
			updateNodeData,
			configureTrigger,
		],
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

			const validLabels = [
				...new Set(
					rawLabels
						.map((label) => label.value.trim())
						.filter((value) => value.length > 0),
				),
			];

			if (validLabels.length === 0) {
				setLabelsError("At least one label is required");
				return;
			}

			const event = createTriggerEvent({ eventId, labels: validLabels });

			startTransition(async () => {
				if (isReconfiguring && triggerId !== undefined) {
					try {
						await client.reconfigureGitHubTrigger({
							triggerId,
							repositoryNodeId: step.repoNodeId,
							installationId: step.installationId,
							event,
						});

						updateNodeData(node, {
							content: {
								...node.content,
								state: {
									status: "configured",
									flowTriggerId: triggerId,
								},
							},
						});
					} catch (_error) {
						// Error is handled by the UI state
					}
				} else {
					configureTrigger(event, step);
				}
			});
		},
		[
			step,
			eventId,
			isReconfiguring,
			node,
			triggerId,
			client,
			updateNodeData,
			configureTrigger,
		],
	);

	const setScrollMode = usePanelScrollMode();
	useEffect(() => {
		const isLimited =
			step.state === "select-event" || step.state === "confirm-repository";
		setScrollMode(isLimited ? "limited" : "full");
		return () => {
			setScrollMode("full");
		};
	}, [step.state, setScrollMode]);

	return (
		<div className="flex flex-col gap-[8px] px-1">
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
				<div className="relative">
					<BackLink onClick={() => setStep({ state: "select-event" })} />
					<LabeledRow
						label={"Event Type"}
						right={
							<EventTypeDisplay
								eventId={step.eventId}
								className="mb-0"
								showDescription={false}
							/>
						}
						className="mb-2"
					/>

					<SettingLabel className="mb-[4px] mt-3">GitHub Setting</SettingLabel>
					<div className="flex w-full items-center gap-[12px] mb-1">
						<div className="shrink-0 w-[120px]">
							<SettingDetail className="mb-0">Organization</SettingDetail>
						</div>
						<div className="grow min-w-0">
							<SelectRepository
								installations={installations}
								installationUrl={installationUrl}
								showMissingAccountLink={false}
								renderRepositories={false}
								onChangeInstallation={setSelectedInstallationId}
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
					<MissingAccountLink href={installationUrl} />

					{selectedInstallationId !== null && (
						<div className="flex flex-col w-full gap-[8px]">
							<SettingDetail className="mb-0">Repository</SettingDetail>
							<div className="flex flex-col gap-y-[8px] relative">
								{selectedInstallationRepositories.map((repo) => (
									<RepositoryItemButton
										key={repo.node_id}
										repo={repo}
										onClick={() => {
											setStep({
												state: "confirm-repository",
												eventId: step.eventId,
												installationId: selectedInstallationId,
												owner: repo.owner.login,
												repo: repo.name,
												repoNodeId: repo.node_id,
											});
										}}
									/>
								))}
							</div>
							<MissingAccountLink href={installationUrl} />
						</div>
					)}
				</div>
			)}

			{step.state === "confirm-repository" && (
				<div className="relative">
					<BackLink
						onClick={() =>
							setStep({ state: "select-repository", eventId: step.eventId })
						}
					/>
					<div className="flex flex-col gap-[8px]">
						<SettingLabel className="mb-[4px]">Event setting</SettingLabel>
						<LabeledRow
							label={"Event Type"}
							right={
								<EventTypeDisplay
									eventId={step.eventId}
									showDescription={false}
								/>
							}
						/>
						<LabeledRow
							label={"Repository"}
							right={<RepositoryDisplay owner={step.owner} repo={step.repo} />}
							className="mt-4 mb-2"
						/>

						<div className="mt-[12px] flex justify-end gap-x-3 px-[4px]">
							<button
								type="button"
								aria-label="Cancel"
								className="relative inline-flex items-center justify-center gap-2 rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)] bg-black/20 border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.6)] disabled:opacity-50"
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
								aria-label="Set Up"
								className="relative inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-medium hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)] text-inverse/80 bg-gradient-to-b from-[#202530] to-[#12151f] border border-[rgba(0,0,0,0.7)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.98] whitespace-nowrap disabled:opacity-50"
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
									} else if (
										isTriggerRequiringLabels(step.eventId) &&
										node.content.state.status === "unconfigured"
									) {
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
												const githubTriggerRegistry = findGitHubTriggerOption(
													step.eventId,
												);
												if (githubTriggerRegistry === undefined) {
													return;
												}
												const outputs: Output[] = [];

												for (const item of githubTriggerRegistry.payload) {
													outputs.push({
														id: OutputId.generate(),
														label: item.label,
														accessor: item.key,
													});
												}

												let triggerId: TriggerId | undefined;
												if (isReconfiguring && triggerId !== undefined) {
													const result = await client.reconfigureGitHubTrigger({
														triggerId,
														repositoryNodeId: step.repoNodeId,
														installationId: step.installationId,
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
													name: isReconfiguring
														? node.name
														: `On ${githubTriggerRegistry.label}`,
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
					onSubmit={handleCallsignSubmit}
				>
					<SectionTitle className="mb-2">Event type</SectionTitle>
					<EventTypeDisplay eventId={step.eventId} showDescription={false} />
					<SectionTitle className="mb-2 mt-4">Repository</SectionTitle>
					<RepositoryDisplay
						owner={step.owner}
						repo={step.repo}
						className="mb-2"
					/>

					<fieldset className="flex flex-col gap-[8px]">
						<div className="flex w-full items-center gap-[12px]">
							<div className="shrink-0 w-[120px]">
								<div className="flex items-center gap-[4px]">
									<SettingDetail className="mb-0">Callsign</SettingDetail>
									<Tooltip
										text={
											<p className="w-[260px]">
												Only comments starting with this callsign will trigger
												the workflow, preventing unnecessary executions from
												unrelated comments.
											</p>
										}
									>
										<button type="button">
											<InfoIcon className="size-[16px]" />
										</button>
									</Tooltip>
								</div>
							</div>
							<div className="grow min-w-0">
								<div className="relative">
									<div className="absolute inset-y-0 left-[12px] flex items-center pointer-events-none">
										<span className="text-[14px]">/</span>
									</div>
									<input
										type="text"
										name="callsign"
										defaultValue={step.callsign}
										className={clsx(
											"w-full rounded-[8px] py-[8px] pl-[28px] pr-[12px] outline-none focus:outline-none border-none text-[14px] text-inverse",
											callsignError
												? "bg-error/10"
												: "bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)]",
										)}
										placeholder="code-review"
									/>
								</div>
							</div>
						</div>
						{callsignError ? (
							<p className="text-[12px] text-red-400 pl-2">{callsignError}</p>
						) : (
							<p className="text-[12px] text-text-muted pl-2">
								A callsign is required for issue comment triggers. Examples:
								/code-review, /check-policy
							</p>
						)}
					</fieldset>

					<div className="mt-[12px] px-[4px] flex justify-end gap-x-3 pt-[8px]">
						{!isReconfiguring && (
							<button
								type="button"
								className="relative inline-flex items-center justify-center gap-2 rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)] bg-black/20 border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.6)] disabled:opacity-50"
								onClick={() => {
									setCallsignError(null);
									setStep({
										state: "select-repository",
										eventId: step.eventId,
									});
								}}
								disabled={isPending || isTriggerConfigPending}
							>
								Back
							</button>
						)}
						<button
							type="submit"
							className="relative inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-medium hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)] text-inverse/80 bg-gradient-to-b from-[#202530] to-[#12151f] border border-[rgba(0,0,0,0.7)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.98] whitespace-nowrap disabled:opacity-50"
							disabled={isPending || isTriggerConfigPending}
						>
							Set Up
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
					isPending={isPending || isTriggerConfigPending}
					labelsError={labelsError}
					initialLabels={step.labels}
					showBackButton={!isReconfiguring}
				/>
			)}
		</div>
	);
}
