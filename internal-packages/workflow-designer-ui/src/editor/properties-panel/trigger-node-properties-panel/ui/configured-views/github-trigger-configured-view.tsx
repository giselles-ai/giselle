import { Button } from "@giselle-internal/ui/button";
import type { TriggerId, TriggerNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import {
	type GitHubEventId,
	githubEvents,
} from "@giselles-ai/trigger-registry";
import clsx from "clsx/lite";
import { AlertCircle, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import ClipboardButton from "../../../../../ui/clipboard-button";
import { useGitHubTrigger } from "../../../../lib/use-github-trigger";
import {
	DiscussionCommentCreatedIcon,
	DiscussionCreatedIcon,
	type IconProps,
	IssueClosedIcon,
	IssueCommentCreatedIcon,
	IssueCreatedIcon,
	IssueLabeledIcon,
	PullRequestClosedIcon,
	PullRequestCommentCreatedIcon,
	PullRequestLabeledIcon,
	PullRequestOpenedIcon,
	PullRequestReadyForReviewIcon,
	PullRequestReviewCommentCreatedIcon,
} from "../../providers/github-trigger/components/icons";
import type { GitHubTriggerReconfigureMode } from "../../providers/github-trigger/github-trigger-properties-panel";
import { GitHubRepositoryBlock } from "../";

// Icon mapping for GitHub trigger events
const EVENT_ICON_MAP = {
	"github.issue.created": IssueCreatedIcon,
	"github.issue.closed": IssueClosedIcon,
	"github.issue.labeled": IssueLabeledIcon,
	"github.issue_comment.created": IssueCommentCreatedIcon,
	"github.pull_request_comment.created": PullRequestCommentCreatedIcon,
	"github.pull_request_review_comment.created":
		PullRequestReviewCommentCreatedIcon,
	"github.pull_request.opened": PullRequestOpenedIcon,
	"github.pull_request.ready_for_review": PullRequestReadyForReviewIcon,
	"github.pull_request.closed": PullRequestClosedIcon,
	"github.pull_request.labeled": PullRequestLabeledIcon,
	"github.discussion.created": DiscussionCreatedIcon,
	"github.discussion_comment.created": DiscussionCommentCreatedIcon,
} satisfies Record<GitHubEventId, React.ComponentType<IconProps>>;

// Default icon for unknown events
const DefaultEventIcon = ({
	size = 18,
	className = "text-inverse",
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
	triggerId,
	node,
	onStartReconfigure,
}: {
	triggerId: TriggerId;
	node: TriggerNode;
	onStartReconfigure: (mode: GitHubTriggerReconfigureMode) => void;
}) {
	const { updateNodeData } = useWorkflowDesigner();
	const {
		isLoading,
		data,
		enableTrigger: enableFlowTrigger,
		disableTrigger: disableFlowTrigger,
	} = useGitHubTrigger(triggerId);
	const [actionInProgress, setActionInProgress] = useState(false);
	const [actionError, setActionError] = useState<Error | null>(null);

	const label = useMemo(() => {
		if (data === undefined) {
			return "";
		}
		const githubEvent = githubEvents[data.trigger.configuration.event.id];
		return githubEvent.label;
	}, [data]);

	if (isLoading && data === undefined) {
		return "Loading...";
	}
	if (data === undefined) {
		return "No Data";
	}

	const beginReconfigure = (mode: GitHubTriggerReconfigureMode) => {
		onStartReconfigure(mode);
		updateNodeData(node, {
			content: {
				...node.content,
				state: {
					status: "reconfiguring",
					flowTriggerId: triggerId,
				},
			},
		});
	};

	const handleEnableFlowTrigger = () => {
		try {
			setActionInProgress(true);
			setActionError(null);
			enableFlowTrigger();
		} catch (error) {
			setActionError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setActionInProgress(false);
		}
	};

	const handleDisableFlowTrigger = () => {
		try {
			setActionInProgress(true);
			setActionError(null);
			disableFlowTrigger();
		} catch (error) {
			setActionError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setActionInProgress(false);
		}
	};

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="flex items-center justify-between gap-[12px]">
				<p className="text-[14px] py-[1.5px] text-inverse">State</p>
				<div className="relative w-[150px] h-[28px] rounded-full border border-white/20 bg-transparent overflow-hidden">
					<div
						className={clsx(
							"absolute inset-y-0 left-0 w-1/2 rounded-full transition-transform duration-300 ease-in-out",
							data.trigger.enable
								? "translate-x-full bg-primary-900"
								: "translate-x-0 bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)]",
						)}
					/>
					<div className="absolute inset-0 grid grid-cols-2 z-10">
						<button
							type="button"
							onClick={handleDisableFlowTrigger}
							disabled={actionInProgress || !data.trigger.enable}
							className="flex items-center justify-center"
						>
							{actionInProgress && !data.trigger.enable && (
								<Loader2 className="h-3 w-3 animate-spin mr-1" />
							)}
							<span
								className={clsx(
									"text-[12px] font-medium transition-colors duration-200",
									!data.trigger.enable ? "text-inverse" : "text-inverse/40",
								)}
							>
								Disabled
							</span>
						</button>
						<button
							type="button"
							onClick={handleEnableFlowTrigger}
							disabled={actionInProgress || data.trigger.enable}
							className="flex items-center justify-center"
						>
							{actionInProgress && data.trigger.enable && (
								<Loader2 className="h-3 w-3 animate-spin mr-1" />
							)}
							<span
								className={clsx(
									"text-[12px] font-medium transition-colors duration-200",
									data.trigger.enable ? "text-inverse" : "text-inverse/40",
								)}
							>
								Enable
							</span>
						</button>
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
			<div className="flex items-center justify-between gap-[12px]">
				<p className="text-[14px] py-[1.5px] text-inverse">Event Type</p>
				<div className="px-[4px] py-0 bg-transparent text-[14px] flex items-center">
					<div className="pr-0 p-2 rounded-lg flex-shrink-0 flex items-center justify-center">
						{(() => {
							const IconComponent =
								EVENT_ICON_MAP[
									data.trigger.configuration.event
										.id as keyof typeof EVENT_ICON_MAP
								] || DefaultEventIcon;
							return <IconComponent size={18} className="text-inverse" />;
						})()}
					</div>
					<span className="pl-2">{label}</span>
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-inverse">Repository</p>
				<div className="px-[4px] pt-[6px]">
					<GitHubRepositoryBlock
						owner={data.githubRepositoryFullname.owner}
						repo={data.githubRepositoryFullname.repo}
					/>
				</div>
				<div className="flex justify-end">
					<Button
						variant="solid"
						size="large"
						type="button"
						onClick={() => {
							beginReconfigure("repository");
						}}
					>
						Change Repository
					</Button>
				</div>
			</div>
			{(data.trigger.configuration.event.id ===
				"github.issue_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.pull_request_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.pull_request_review_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.discussion_comment.created") && (
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px] text-inverse">Call sign</p>
					<div className="px-[4px] py-[9px] w-full bg-transparent text-[14px] flex items-center gap-[8px]">
						<span>/{data.trigger.configuration.event.conditions.callsign}</span>
						<ClipboardButton
							text={`/${data.trigger.configuration.event.conditions.callsign}`}
							className="text-text-muted hover:text-text/60"
							sizeClassName="h-[16px] w-[16px]"
						/>
					</div>
					<p className="text-[12px] text-inverse px-[4px] w-full">
						Use{" "}
						<span className="text-blue-400 font-medium">
							/{data.trigger.configuration.event.conditions.callsign}
						</span>{" "}
						in GitHub comments to trigger this workflow.
					</p>
					<div className="flex justify-end">
						<Button
							variant="solid"
							size="large"
							type="button"
							onClick={() => {
								beginReconfigure("callsign");
							}}
						>
							Change Callsign
						</Button>
					</div>
				</div>
			)}
			{(data.trigger.configuration.event.id === "github.issue.labeled" ||
				data.trigger.configuration.event.id ===
					"github.pull_request.labeled") && (
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px] text-inverse">Labels</p>
					<div className="space-y-[4px]">
						<div className="px-[4px] py-[9px] w-full bg-transparent text-[14px]">
							<div className="flex flex-wrap gap-[4px]">
								{data.trigger.configuration.event.conditions.labels.map(
									(label) => (
										<span
											key={label}
											className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-[12px]"
										>
											{label}
										</span>
									),
								)}
							</div>
						</div>
						<p className="text-[12px] text-inverse px-[4px]">
							This workflow triggers when any of these labels are added to an
							issue.
						</p>
					</div>
					<div className="flex justify-end">
						<Button
							variant="solid"
							size="large"
							type="button"
							onClick={() => {
								beginReconfigure("labels");
							}}
						>
							Change Labels
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
