import type { FlowTriggerId, TriggerNode } from "@giselle-sdk/data-type";
import { githubTriggerIdToLabel } from "@giselle-sdk/flow";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import ClipboardButton from "../../../../../ui/clipboard-button";
import { useGitHubTrigger } from "../../../../lib/use-github-trigger";
import {
	IssueClosedIcon,
	IssueCommentCreatedIcon,
	IssueCreatedIcon,
	PullRequestClosedIcon,
	PullRequestCommentCreatedIcon,
	PullRequestOpenedIcon,
	PullRequestReadyForReviewIcon,
	PullRequestReviewCommentCreatedIcon,
} from "../../providers/github-trigger/components/icons";
import { GitHubRepositoryBlock } from "../";

// Icon mapping for GitHub trigger events
const EVENT_ICON_MAP = {
	"github.issue.created": IssueCreatedIcon,
	"github.issue.closed": IssueClosedIcon,
	"github.issue_comment.created": IssueCommentCreatedIcon,
	"github.pull_request_comment.created": PullRequestCommentCreatedIcon,
	"github.pull_request_review_comment.created":
		PullRequestReviewCommentCreatedIcon,
	"github.pull_request.opened": PullRequestOpenedIcon,
	"github.pull_request.ready_for_review": PullRequestReadyForReviewIcon,
	"github.pull_request.closed": PullRequestClosedIcon,
} as const;

// Default icon for unknown events
const DefaultEventIcon = ({
	size = 18,
	className = "text-white",
}: {
	size?: number;
	className?: string;
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		aria-label="GitHub trigger"
	>
		<title>GitHub trigger</title>
		<path d="M0 24H24V0H0V24Z" fill="currentColor" />
	</svg>
);

export function GitHubTriggerConfiguredView({
	flowTriggerId,
	node,
}: {
	flowTriggerId: FlowTriggerId;
	node: TriggerNode;
}) {
	const { updateNodeData } = useWorkflowDesigner();
	const { isLoading, data, enableFlowTrigger, disableFlowTrigger } =
		useGitHubTrigger(flowTriggerId);
	const [actionInProgress, setActionInProgress] = useState(false);
	const [actionError, setActionError] = useState<Error | null>(null);

	if (isLoading && data === undefined) {
		return "Loading...";
	}
	if (data === undefined) {
		return "No Data";
	}

	const handleEnableFlowTrigger = async () => {
		try {
			setActionInProgress(true);
			setActionError(null);
			await enableFlowTrigger();
		} catch (error) {
			setActionError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setActionInProgress(false);
		}
	};

	const handleDisableFlowTrigger = async () => {
		try {
			setActionInProgress(true);
			setActionError(null);
			await disableFlowTrigger();
		} catch (error) {
			setActionError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setActionInProgress(false);
		}
	};

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="flex flex-col">
				<div className="flex flex-row items-center justify-between">
					<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">State</p>

					{/* Divider */}
					<div className="flex-grow mx-[12px] h-[1px] bg-black-200/30" />

					<div className="relative">
						{/* Background container */}
						<div className="w-[150px] h-[28px] bg-[#2A2A36] rounded-full flex items-center overflow-hidden">
							{/* Sliding highlight */}
							<div
								className={clsx(
									"absolute w-[75px] h-[28px] rounded-full transition-transform duration-300 ease-in-out",
									data.trigger.enable
										? "translate-x-[75px] bg-primary-900"
										: "translate-x-0 bg-[#3F3F4A]",
								)}
							/>

							{/* Button labels - always visible, change opacity based on state */}
							<div className="absolute inset-0 flex">
								<button
									type="button"
									onClick={handleDisableFlowTrigger}
									disabled={actionInProgress || !data.trigger.enable}
									className="flex-1 flex items-center justify-center px-0.5 relative"
								>
									{actionInProgress && !data.trigger.enable && (
										<Loader2 className="h-3 w-3 animate-spin absolute left-2" />
									)}
									<span
										className={clsx(
											"text-[12px] font-medium transition-colors duration-200",
											!data.trigger.enable ? "text-white" : "text-white/40",
										)}
									>
										Disabled
									</span>
								</button>
								<button
									type="button"
									onClick={handleEnableFlowTrigger}
									disabled={actionInProgress || data.trigger.enable}
									className="flex-1 flex items-center justify-center px-0.5 relative"
								>
									{actionInProgress && data.trigger.enable && (
										<Loader2 className="h-3 w-3 animate-spin absolute left-2" />
									)}
									<span
										className={clsx(
											"text-[12px] font-medium transition-colors duration-200",
											data.trigger.enable
												? "text-white font-semibold"
												: "text-white/40",
										)}
									>
										Enable
									</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			{actionError && (
				<div className="bg-red-500/10 border border-red-500/30 rounded-md p-2 mt-2 flex items-center space-x-2">
					<AlertCircle className="h-4 w-4 text-red-500" />
					<span className="text-red-500 text-xs">
						{actionError.message || "Failed to update trigger state"}
					</span>
				</div>
			)}
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Event Type</p>
				<div className="px-[4px] py-0 w-full bg-transparent text-[14px] flex items-center">
					<div className="pr-0 p-2 rounded-lg flex-shrink-0 flex items-center justify-center">
						{(() => {
							const IconComponent =
								EVENT_ICON_MAP[
									data.trigger.configuration.event
										.id as keyof typeof EVENT_ICON_MAP
								] || DefaultEventIcon;
							return <IconComponent size={18} className="text-white" />;
						})()}
					</div>
					<span className="pl-2">
						{githubTriggerIdToLabel(data.trigger.configuration.event.id)}
					</span>
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Repository</p>
				<div className="flex justify-between">
					<div className="px-[4px] pt-[6px]">
						<GitHubRepositoryBlock
							owner={data.githubRepositoryFullname.owner}
							repo={data.githubRepositoryFullname.repo}
						/>
					</div>
					<button
						type="button"
						className="bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors"
						onClick={() => {
							updateNodeData(node, {
								content: {
									...node.content,
									state: {
										status: "reconfiguring",
										flowTriggerId,
									},
								},
							});
						}}
					>
						Change Repository
					</button>
				</div>
			</div>
			{(data.trigger.configuration.event.id ===
				"github.issue_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.pull_request_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.pull_request_review_comment.created") && (
				<div>
					<div className="space-y-[4px]">
						<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Call sign</p>
						<div className="px-[4px] py-[9px] w-full bg-transparent text-[14px] flex items-center gap-[8px]">
							<span>
								/{data.trigger.configuration.event.conditions.callsign}
							</span>
							<ClipboardButton
								text={`/${data.trigger.configuration.event.conditions.callsign}`}
								className="text-black-400 hover:text-black-300"
								sizeClassName="h-[16px] w-[16px]"
							/>
						</div>
						<p className="text-[12px] text-white-400 px-[4px]">
							Use{" "}
							<span className="text-blue-400 font-medium">
								/{data.trigger.configuration.event.conditions.callsign}
							</span>{" "}
							in GitHub comments to trigger this workflow.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
