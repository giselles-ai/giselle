import { Button } from "@giselle-internal/ui/button";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import { githubActions } from "@giselles-ai/action-registry";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselles-ai/react";
import { defaultName } from "@giselles-ai/node-registry";
import type {
	ActionNode,
	ConnectionId,
	GitHubActionConfiguredState,
	Input,
	Node,
	NodeId,
	NodeLike,
	OutputId,
} from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { PlusIcon, TriangleAlert, XIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import useSWR from "swr";
// Import icons to display next to Event Type
import {
	DiscussionCommentCreatedIcon,
	IssueCommentCreatedIcon,
	IssueCreatedIcon,
	PullRequestCommentCreatedIcon,
	PullRequestReviewCommentCreatedIcon,
} from "../../trigger-node-properties-panel/providers/github-trigger/components/icons";
import { GitHubRepositoryBlock } from "../../trigger-node-properties-panel/ui";
import { type InputWithConnectedOutput, useConnectedInputs } from "../lib";

// Default icon for actions without specific icons
function _DefaultActionIcon({
	size = 18,
	className = "text-inverse",
}: {
	size?: number;
	className?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-label="GitHub Action"
		>
			<title>GitHub Action</title>
			<path
				d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function getActionIcon(actionId: string) {
	const iconProps = { size: 18, className: "text-inverse" } as const;
	switch (actionId) {
		case "github.create.issue":
			return <IssueCreatedIcon {...iconProps} />;
		case "github.create.issueComment":
			return <IssueCommentCreatedIcon {...iconProps} />;
		case "github.create.pullRequestComment":
			return <PullRequestCommentCreatedIcon {...iconProps} />;
		case "github.reply.pullRequestReviewComment":
			return <PullRequestReviewCommentCreatedIcon {...iconProps} />;
		case "github.get.discussion":
			return <_DefaultActionIcon {...iconProps} />;
		case "github.create.discussionComment":
			return <DiscussionCommentCreatedIcon {...iconProps} />;
		default:
			return <_DefaultActionIcon {...iconProps} />;
	}
}

function getNodeContentType(node: Node | NodeLike): string {
	switch (node.type) {
		case "operation":
			return node.content.type;
		case "variable":
			return node.content.type;
		default:
			return "unknown";
	}
}

export function GitHubActionConfiguredView({
	node,
	inputs,
	state,
	handleClick,
	isGenerating,
}: {
	node: ActionNode;
	inputs: Input[];
	state: GitHubActionConfiguredState;
	handleClick: () => void;
	isGenerating: boolean;
}) {
	const client = useGiselleEngine();
	const {
		deleteConnection,
		updateNodeData,
		data: { ui },
	} = useWorkflowDesigner();
	const { isLoading, data } = useSWR(
		{
			installationId: state.installationId,
			repositoryNodeId: state.repositoryNodeId,
		},
		({ installationId, repositoryNodeId }) =>
			client.getGitHubRepositoryFullname({
				installationId,
				repositoryNodeId,
			}),
	);

	const { connectedInputs } = useConnectedInputs(node.id, inputs);

	const handleClickRemoveButton = useCallback(
		(connectionId: ConnectionId) => () => {
			deleteConnection(connectionId);
		},
		[deleteConnection],
	);

	const githubActionOption = useMemo(
		() => githubActions[state.commandId],
		[state.commandId],
	);

	if (githubActionOption === undefined) {
		return null;
	}

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="space-y-0">
				<SettingDetail className="mb-0">Repository</SettingDetail>
				<div className="px-[4px] pt-[6px]">
					{isLoading || data === undefined ? (
						<p>Loading...</p>
					) : (
						<GitHubRepositoryBlock
							owner={data.fullname.owner}
							repo={data.fullname.repo}
						/>
					)}
				</div>
				<div className="flex w-full items-center justify-end">
					<Button
						variant="solid"
						size="large"
						type="button"
						onClick={() => {
							updateNodeData(node, {
								content: {
									...node.content,
									command: {
										provider: "github",
										state: {
											status: "reconfiguring",
											commandId: state.commandId,
										},
									},
								},
							});
						}}
					>
						Change Repository
					</Button>
				</div>
			</div>

			<div className="space-y-0">
				<div className="flex w-full items-center gap-[12px]">
					<div className="shrink-0 w-[120px]">
						<SettingDetail className="mb-0">Event Type</SettingDetail>
					</div>
					<div className="grow min-w-0 px-[4px] py-0 w-full bg-transparent text-[14px] flex items-center gap-[8px]">
						{getActionIcon(state.commandId)}
						<span>{githubActionOption.label}</span>
					</div>
				</div>
			</div>

			<div className="space-y-0">
				<SettingLabel className="mb-0">Input Parameter</SettingLabel>
				<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[4px]">
					<ul className="w-full flex flex-col gap-[12px]">
						{connectedInputs.map((input) => (
							<li key={input.id}>
								<div className=" flex items-center justify-between">
									<div className="flex items-center gap-[8px]">
										<span className="text-[14px]">{input.label}</span>
										{input.isRequired && !input.connectedOutput && (
											<span className="bg-red-900/20 text-red-900 text-[12px] font-medium px-[6px] py-[1px] rounded-full">
												required
											</span>
										)}
									</div>
									{input.connectedOutput ? (
										<div
											className={clsx(
												"group inline-flex items-center border px-[4px] py-[2px] rounded-[4px] transition-colors text-[12px] gap-[4px]",
												"data-[content-type=textGeneration]:bg-primary-900/20 data-[content-type=textGeneration]:border-primary-900/40 data-[content-type=textGeneration]:text-primary-900",
												"data-[content-type=github]:bg-github-node-1/20 data-[content-type=github]:border-github-node-1/40 data-[content-type=github]:text-github-node-1",
												"data-[content-type=text]:bg-text-node-1/20 data-[content-type=text]:border-text-node-1/40 data-[content-type=text]:text-text-node-1",
												"data-[content-type=file]:bg-file-node-1/20 data-[content-type=file]:border-file-node-1/40 data-[content-type=file]:text-file-node-1",
												"data-[content-type=webPage]:bg-webPage-node-1/20 data-[content-type=webPage]:border-webPage-node-1/40 data-[content-type=webPage]:text-webPage-node-1",
												"data-[content-type=action]:bg-action-node-1/20 data-[content-type=action]:border-action-node-1/40 data-[content-type=action]:text-action-node-1",
												"data-[content-type=trigger]:bg-trigger-node-1/20 data-[content-type=trigger]:border-trigger-node-1/40 data-[content-type=trigger]:text-trigger-node-1",
												"data-[content-type=query]:bg-query-node-1/20 data-[content-type=query]:border-query-node-1/40 data-[content-type=query]:text-query-node-1",
												"data-[content-type=imageGeneration]:bg-image-generation-node-1/20 data-[content-type=imageGeneration]:border-image-generation-node-1/40 data-[content-type=imageGeneration]:text-image-generation-node-1",
												"border-transparent",
											)}
											data-content-type={getNodeContentType(
												input.connectedOutput.node,
											)}
										>
											<span className="truncate">
												{defaultName(input.connectedOutput.node as Node)} /{" "}
												{input.connectedOutput.label}
											</span>
											<button
												type="button"
												className="opacity-60 hover:opacity-100 transition-opacity"
												onClick={handleClickRemoveButton(
													input.connectedOutput.connectionId,
												)}
											>
												<XIcon className="size-[10px]" />
											</button>
										</div>
									) : (
										<SelectOutputPopover nodeId={node.id} input={input} />
									)}
								</div>
								{ui.nodeState[node.id]?.showError &&
									input.isRequired &&
									input.connectedOutput === undefined && (
										<div className="flex justify-end">
											<div className="text-red-900 flex items-center gap-[4px]">
												<TriangleAlert className="size-[14px]" />
												<span>Please choose a source</span>
											</div>
										</div>
									)}
							</li>
						))}
					</ul>
				</div>
			</div>
			<div className="px-[4px] py-[16px]">
				<Button
					type="button"
					onClick={handleClick}
					variant="glass"
					size="large"
					className="w-full"
				>
					{isGenerating ? "Stop" : "Run Action"}
				</Button>
			</div>
		</div>
	);
}

type OutputWithDetails = {
	id: OutputId;
	label: string;
	node: Node;
};

function SelectOutputPopover({
	nodeId,
	input,
}: {
	nodeId: NodeId;
	input: InputWithConnectedOutput;
}) {
	const { data, addConnection, isSupportedConnection } = useWorkflowDesigner();

	const node = useMemo(
		() => data.nodes.find((n) => n.id === nodeId),
		[data.nodes, nodeId],
	);

	const groupedOutputs = useMemo(() => {
		const textGeneratorNodes: OutputWithDetails[] = [];
		const textNodes: OutputWithDetails[] = [];
		const fileNodes: OutputWithDetails[] = [];
		const actionNodes: OutputWithDetails[] = [];
		const triggerNodes: OutputWithDetails[] = [];
		const githubNodes: OutputWithDetails[] = [];
		const otherNodes: OutputWithDetails[] = [];

		if (node === undefined) {
			return [];
		}

		for (const currentNode of data.nodes) {
			if (currentNode.id === nodeId) {
				continue;
			}

			// Check if this node can connect to our action node
			const { canConnect } = isSupportedConnection(currentNode, node);
			if (!canConnect) {
				continue; // Skip unsupported connections
			}

			for (const output of currentNode.outputs) {
				const outputWithDetails = { ...output, node: currentNode as Node };

				// Categorize by node type
				if (currentNode.type === "operation") {
					switch (currentNode.content.type) {
						case "textGeneration":
							textGeneratorNodes.push(outputWithDetails);
							break;
						case "action":
							actionNodes.push(outputWithDetails);
							break;
						case "trigger":
							triggerNodes.push(outputWithDetails);
							break;
						default:
							otherNodes.push(outputWithDetails);
							break;
					}
				} else if (currentNode.type === "variable") {
					switch (currentNode.content.type) {
						case "text":
							textNodes.push(outputWithDetails);
							break;
						case "file":
							fileNodes.push(outputWithDetails);
							break;
						case "github":
							githubNodes.push(outputWithDetails);
							break;
						default:
							otherNodes.push(outputWithDetails);
							break;
					}
				} else {
					otherNodes.push(outputWithDetails);
				}
			}
		}

		return [
			{ label: "Text Generator", nodes: textGeneratorNodes },
			{ label: "Action", nodes: actionNodes },
			{ label: "Trigger", nodes: triggerNodes },
			{ label: "Text", nodes: textNodes },
			{ label: "File", nodes: fileNodes },
			{ label: "GitHub", nodes: githubNodes },
			{ label: "Other", nodes: otherNodes },
		].filter((group) => group.nodes.length > 0);
	}, [data.nodes, nodeId, node, isSupportedConnection]);

	const handleSelectOutput = useCallback(
		(outputNode: Node, outputId: OutputId) => {
			if (node === undefined) {
				return;
			}
			addConnection({
				outputNode,
				outputId,
				inputNode: node,
				inputId: input.id,
			});
		},
		[node, addConnection, input],
	);

	return (
		<DropdownMenu
			trigger={
				<Button leftIcon={<PlusIcon className="size-[12px]" />}>
					Select Source
				</Button>
			}
			items={groupedOutputs.map((groupedOutput) => ({
				groupId: groupedOutput.label,
				groupLabel: groupedOutput.label,
				items: groupedOutput.nodes.map((node) => ({
					...node,
					value: node.id,
					label: `${node.node.name ?? defaultName(node.node)} / ${node.label}`,
				})),
			}))}
			renderItem={(item) => (
				<p className="text-[12px] truncate">
					{item.node.name ?? defaultName(item.node)} / {item.label}
				</p>
			)}
			onSelect={(_event, item) => handleSelectOutput(item.node, item.id)}
		/>
	);
}
