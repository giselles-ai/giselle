import {
	type GitHubFlowTriggerEvent,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle-engine";
import {
	useGiselleEngine,
	useIntegration,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { InfoIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../../ui/select";
import { Tooltip } from "../../../../../ui/tooltip";
import { SelectRepository } from "../../../ui";
import { GitHubRepositoryBlock, GitHubTriggerConfiguredView } from "../../ui";
import { InstallGitHubApplication } from "./components/install-application";
import { Unauthorized } from "./components/unauthorized";

export function GitHubTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { value } = useIntegration();

	if (node.content.state.status === "configured") {
		return (
			<GitHubTriggerConfiguredView
				flowTriggerId={node.content.state.flowTriggerId}
			/>
		);
	}

	if (value?.github === undefined) {
		return "unset";
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

interface SelectRepositoryStep {
	state: "select-repository";
}
interface SelectEventStep {
	state: "select-event";
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
}
interface InputCallsignStep {
	state: "input-callsign";
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
	eventId: string;
}
export type GitHubTriggerSetupStep =
	| SelectRepositoryStep
	| SelectEventStep
	| InputCallsignStep;

function Installed({
	installations,
	node,
	installationUrl,
}: {
	installations: GitHubIntegrationInstallation[];
	node: TriggerNode;
	installationUrl: string;
}) {
	const [step, setStep] = useState<GitHubTriggerSetupStep>({
		state: "select-repository",
	});
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const [eventId, setEventId] = useState<GitHubTriggerEventId>(
		"github.issue.created",
	);
	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			if (step.state !== "select-event") {
				throw new Error("Unexpected state");
			}
			let event: GitHubFlowTriggerEvent | undefined;
			const formData = new FormData(e.currentTarget);
			switch (eventId) {
				case "github.issue.created":
				case "github.issue.closed":
				case "github.pull_request.ready_for_review":
				case "github.pull_request.closed":
				case "github.pull_request.opened":
					event = {
						id: eventId,
					};
					break;
				case "github.issue_comment.created": {
					const callsign = formData.get("callsign");
					if (typeof callsign !== "string" || callsign.length === 0) {
						throw new Error("Unexpected request");
					}
					event = {
						id: "github.issue_comment.created",
						conditions: {
							callsign,
						},
					};
					break;
				}
				case "github.pull_request_comment.created": {
					const callsign = formData.get("callsign");
					if (typeof callsign !== "string" || callsign.length === 0) {
						throw new Error("Unexpected request");
					}
					event = {
						id: "github.pull_request_comment.created",
						conditions: {
							callsign,
						},
					};
					break;
				}
				case "github.pull_request_review_comment.created": {
					const callsign = formData.get("callsign");
					if (typeof callsign !== "string" || callsign.length === 0) {
						throw new Error("Unexpected request");
					}
					event = {
						id: "github.pull_request_review_comment.created",
						conditions: {
							callsign,
						},
					};
					break;
				}
				default: {
					const _exhaustiveCheck: never = eventId;
					throw new Error(`Unhandled eventId: ${_exhaustiveCheck}`);
				}
			}
			if (event === undefined) {
				return;
			}
			const trigger = githubTriggers[event.id];
			const outputs: Output[] = [];
			for (const key of trigger.event.payloads.keyof().options) {
				outputs.push({
					id: OutputId.generate(),
					label: key,
					accessor: key,
				});
			}

			startTransition(async () => {
				const { triggerId } = await client.configureTrigger({
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
				updateNodeData(node, {
					content: {
						...node.content,
						state: {
							status: "configured",
							flowTriggerId: triggerId,
						},
					},
					outputs: [...node.outputs, ...outputs],
					name: `On ${trigger.event.label}`,
				});
			});
		},
		[
			eventId,
			workspace?.id,
			client.configureTrigger,
			node,
			updateNodeData,
			step,
		],
	);

	return (
		<div className="flex flex-col gap-[16px] px-[16px]">
			<p className="text-[18px]">Set Up Trigger in GitHub Repository</p>
			{step.state === "select-repository" && (
				<SelectRepository
					installations={installations}
					installationUrl={installationUrl}
					onSelectRepository={(value: {
						installationId: number;
						owner: string;
						repo: string;
						repoNodeId: string;
					}) => {
						setStep({
							state: "select-event",
							installationId: value.installationId,
							owner: value.owner,
							repo: value.repo,
							repoNodeId: value.repoNodeId,
						});
					}}
				/>
			)}
			{step.state === "select-event" && (
				<form
					className="w-full flex flex-col gap-[16px]"
					onSubmit={handleSubmit}
				>
					<GitHubRepositoryBlock owner={step.owner} repo={step.repo} />
					<p className="text-[14px]">
						Choose when you want to trigger the flow.
					</p>
					<fieldset className="flex flex-col gap-[4px]">
						<Select
							name="event"
							value={eventId}
							onValueChange={(value) =>
								setEventId(value as GitHubTriggerEventId)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select an event" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(githubTriggers).map(([id, githubTrigger]) => (
									<SelectItem key={id} value={id}>
										{githubTrigger.event.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</fieldset>
					{(eventId === "github.issue_comment.created" ||
						eventId === "github.pull_request_comment.created" ||
						eventId === "github.pull_request_review_comment.created") && (
						<fieldset className="flex flex-col gap-[4px]">
							<div className="flex items-center gap-[4px]">
								<p className="text-[16px]">Callsign</p>
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
							<div className="relative">
								<div className="absolute inset-y-0 left-0 flex items-center pl-[16px] pointer-events-none">
									<span className="text-[14px]">/</span>
								</div>
								<input
									type="text"
									name="callsign"
									className={clsx(
										"group w-full flex justify-between items-center rounded-[8px] py-[8px] pl-[24px] pr-[16px] outline-none focus:outline-none",
										"border-[2px] border-white-900",
										"text-[14px]",
									)}
									placeholder="code-review"
								/>
							</div>
							<p className="text-[14px] text-black-400">
								A callsign is required for issue comment triggers. Examples:
								/code-review, /check-policy
							</p>
						</fieldset>
					)}
					<button
						type="submit"
						className="h-[28px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent disabled:opacity-50"
						disabled={isPending}
					>
						{isPending ? "Setting Up..." : "Set Up"}
					</button>
				</form>
			)}
		</div>
	);
}
