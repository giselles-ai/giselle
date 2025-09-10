import {
	type InputId,
	isActionNode,
	isImageGenerationNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
	type NodeId,
	type NodeLike,
	type OutputId,
} from "@giselle-sdk/data-type";
import {
	defaultName,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import {
	Handle,
	type NodeProps,
	type NodeTypes,
	Position,
} from "@xyflow/react";
import clsx from "clsx/lite";
import { CheckIcon, SquareIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { NodeIcon } from "../../icons/node";
import { EditableText } from "../../ui/editable-text";
import { Tooltip } from "../../ui/tooltip";
import { GitHubNodeInfo } from "./ui";
import { GitHubTriggerStatusBadge } from "./ui/github-trigger/status-badge";
import { useCurrentNodeGeneration } from "./use-current-node-generation";

// Helper function to get completion label from node LLM provider
function getCompletionLabel(node: NodeLike): string {
	if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
		return node.content.llm.provider;
	}
	return "Completed";
}

// Helper function to check if a GitHub node requires setup
function isGitHubNodeRequiresSetup(node: NodeLike): boolean {
	if (isTriggerNode(node, "github")) {
		return node.content.state.status !== "configured";
	}
	if (isActionNode(node, "github")) {
		return node.content.command.state.status !== "configured";
	}
	if (isVectorStoreNode(node, "github")) {
		return node.content.source.state.status !== "configured";
	}
	return false;
}

export const nodeTypes: NodeTypes = {
	giselle: CustomXyFlowNode,
};

function CustomXyFlowNode({ id, selected }: NodeProps) {
	const { node, connections, highlighted } = useWorkflowDesignerStore(
		useShallow((s) => ({
			node: s.workspace.nodes.find((node) => node.id === id),
			connections: s.workspace.connections,
			highlighted: s.workspace.ui.nodeState[id as NodeId]?.highlighted,
		})),
	);

	const connectedInputIds = useMemo(
		() =>
			connections
				.filter((connection) => connection.inputNode.id === id)
				.map((connection) => connection.inputId),
		[connections, id],
	);
	const connectedOutputIds = useMemo(
		() =>
			connections
				.filter((connection) => connection.outputNode.id === id)
				.map((connection) => connection.outputId),
		[connections, id],
	);

	// Early return if workspace is not yet initialized
	if (!node) {
		return null;
	}

	return (
		<NodeComponent
			node={node}
			selected={selected}
			highlighted={highlighted}
			connectedInputIds={connectedInputIds}
			connectedOutputIds={connectedOutputIds}
		/>
	);
}

export function NodeComponent({
	node,
	selected,
	highlighted,
	connectedInputIds,
	connectedOutputIds,
	preview = false,
}: {
	node: NodeLike;
	selected?: boolean;
	preview?: boolean;
	highlighted?: boolean;
	connectedInputIds?: InputId[];
	connectedOutputIds?: OutputId[];
}) {
	const updateNodeData = useWorkflowDesignerStore((state) => state.updateNode);
	const { currentGeneration, stopCurrentGeneration } = useCurrentNodeGeneration(
		node.id,
	);

	const prevGenerationStatusRef = useRef(currentGeneration?.status);
	const [showCompleteLabel, startTransition] = useTransition();
	useEffect(() => {
		if (currentGeneration === undefined) {
			return;
		}
		if (
			prevGenerationStatusRef.current === "running" &&
			currentGeneration.status === "completed"
		) {
			startTransition(
				async () =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve();
						}, 2000);
					}),
			);
		}
		prevGenerationStatusRef.current = currentGeneration.status;
	}, [currentGeneration]);
	const metadataTexts = useMemo(() => {
		const tmp: { label: string; tooltip: string }[] = [];
		if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
			tmp.push({ label: node.content.llm.provider, tooltip: "LLM Provider" });
		}
		tmp.push({ label: node.id.substring(3, 11), tooltip: "Node ID" });
		return tmp;
	}, [node]);

	const requiresSetup = isGitHubNodeRequiresSetup(node);

	return (
		<div
			data-type={node.type}
			data-content-type={node.content.type}
			data-selected={selected}
			data-highlighted={highlighted}
			data-preview={preview}
			data-current-generation-status={currentGeneration?.status}
			data-vector-store-source-provider={
				isVectorStoreNode(node) ? node.content.source.provider : undefined
			}
			className={clsx(
				"group relative flex flex-col rounded-[16px] py-[16px] gap-[16px] min-w-[180px]",
				"bg-gradient-to-tl transition-all backdrop-blur-[4px]",
				"data-[content-type=text]:from-text-node-1] data-[content-type=text]:to-text-node-2 data-[content-type=text]:shadow-text-node-1",
				"data-[content-type=file]:from-file-node-1] data-[content-type=file]:to-file-node-2 data-[content-type=file]:shadow-file-node-1",
				"data-[content-type=webPage]:from-webPage-node-1] data-[content-type=webPage]:to-webPage-node-2 data-[content-type=webPage]:shadow-webPage-node-1",
				"data-[content-type=textGeneration]:from-generation-node-1] data-[content-type=textGeneration]:to-generation-node-2 data-[content-type=textGeneration]:shadow-generation-node-1",
				"data-[content-type=imageGeneration]:from-image-generation-node-1] data-[content-type=imageGeneration]:to-image-generation-node-2 data-[content-type=imageGeneration]:shadow-image-generation-node-1",
				"data-[content-type=github]:from-github-node-1] data-[content-type=github]:to-github-node-2 data-[content-type=github]:shadow-github-node-1",
				"data-[content-type=vectorStore]:data-[vector-store-source-provider=github]:from-github-node-1] data-[content-type=vectorStore]:data-[vector-store-source-provider=github]:to-github-node-2 data-[content-type=vectorStore]:data-[vector-store-source-provider=github]:shadow-github-node-1",
				"data-[content-type=vectorStore]:data-[vector-store-source-provider=githubPullRequest]:from-github-node-1] data-[content-type=vectorStore]:data-[vector-store-source-provider=githubPullRequest]:to-github-node-2 data-[content-type=vectorStore]:data-[vector-store-source-provider=githubPullRequest]:shadow-github-node-1",
				"data-[content-type=webSearch]:from-web-search-node-1] data-[content-type=webSearch]:to-web-search-node-2 data-[content-type=webSearch]:shadow-web-search-node-1",
				"data-[content-type=audioGeneration]:from-audio-generation-node-1] data-[content-type=audioGeneration]:to-audio-generation-node-2 data-[content-type=audioGeneration]:shadow-audio-generation-node-1",
				"data-[content-type=videoGeneration]:from-video-generation-node-1] data-[content-type=videoGeneration]:to-video-generation-node-2 data-[content-type=videoGeneration]:shadow-video-generation-node-1",
				"data-[content-type=trigger]:from-trigger-node-1/60] data-[content-type=trigger]:to-trigger-node-2 data-[content-type=trigger]:shadow-trigger-node-1",
				"data-[content-type=action]:from-action-node-1] data-[content-type=action]:to-action-node-2 data-[content-type=action]:shadow-action-node-1",
				"data-[content-type=query]:from-query-node-1] data-[content-type=query]:to-query-node-2 data-[content-type=query]:shadow-query-node-1",
				"data-[selected=true]:shadow-[0px_0px_16px_0px]",
				"data-[selected=true]:data-[content-type=trigger]:shadow-[0px_0px_16px_0px_hsl(220,15%,50%)]",
				"data-[highlighted=true]:shadow-[0px_0px_16px_0px]",
				"data-[highlighted=true]:data-[content-type=trigger]:shadow-[0px_0px_16px_0px_hsl(220,15%,50%)]",
				"data-[preview=true]:opacity-50",
				"not-data-preview:min-h-[110px]",
				requiresSetup && "opacity-80",
			)}
		>
			{currentGeneration?.status === "created" &&
				node.content.type !== "trigger" && (
					<div className="absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]">
						<div className="flex items-center">
							<p className="text-xs font-medium font-sans text-black-200">
								Waiting...
							</p>
						</div>
					</div>
				)}
			{(currentGeneration?.status === "queued" ||
				currentGeneration?.status === "running") &&
				node.content.type !== "trigger" && (
					<div className="absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]">
						<div className="flex items-center">
							<p className="text-xs font-medium font-sans bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[rgba(59,_130,_246,_1)] via-[rgba(255,_255,_255,_0.5)] to-[rgba(59,_130,_246,_1)] text-transparent animate-shimmer">
								Generating...
							</p>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									stopCurrentGeneration();
								}}
								className="ml-1 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
							>
								<SquareIcon className="w-2 h-2 text-white" fill="white" />
							</button>
						</div>
					</div>
				)}
			<AnimatePresence>
				{showCompleteLabel && node.content.type !== "trigger" && (
					<motion.div
						className="absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px] text-green-900"
						exit={{ opacity: 0 }}
					>
						<div className="flex items-center gap-[4px]">
							<p className="text-[10px] font-medium font-geist text-black-400 leading-[140%]">
								{getCompletionLabel(node)}
							</p>
							<CheckIcon className="w-4 h-4" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<div
				className={clsx(
					"absolute z-0 rounded-[16px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder",
					requiresSetup
						? "border-black/60 border-dashed [border-width:2px]"
						: "border-transparent",
					"group-data-[content-type=text]:from-text-node-1/40 group-data-[content-type=text]:to-text-node-1",
					"group-data-[content-type=file]:from-file-node-1/40 group-data-[content-type=file]:to-file-node-1",
					"group-data-[content-type=webPage]:from-webPage-node-1/40 group-data-[content-type=webPage]:to-webPage-node-1",
					"group-data-[content-type=textGeneration]:from-generation-node-1/40 group-data-[content-type=textGeneration]:to-generation-node-1",
					"group-data-[content-type=imageGeneration]:from-image-generation-node-1/40 group-data-[content-type=imageGeneration]:to-image-generation-node-1",
					"group-data-[content-type=github]:from-github-node-1/40 group-data-[content-type=github]:to-github-node-1",
					"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=github]:from-github-node-1/40 group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=github]:to-github-node-1",
					"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=githubPullRequest]:from-github-node-1/40 group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=githubPullRequest]:to-github-node-1",
					"group-data-[content-type=webSearch]:from-web-search-node-1/40 group-data-[content-type=webSearch]:to-web-search-node-1",
					"group-data-[content-type=audioGeneration]:from-audio-generation-node-1/40 group-data-[content-type=audioGeneration]:to-audio-generation-node-1",
					"group-data-[content-type=videoGeneration]:from-video-generation-node-1/40 group-data-[content-type=videoGeneration]:to-video-generation-node-1",
					"group-data-[content-type=trigger]:from-trigger-node-1/60 group-data-[content-type=trigger]:to-trigger-node-1",
					"group-data-[content-type=action]:from-action-node-1/40 group-data-[content-type=action]:to-action-node-1",
					"group-data-[content-type=query]:from-query-node-1/40 group-data-[content-type=query]:to-query-node-1",
				)}
			/>

			<div className={clsx("px-[16px] relative")}>
				{isTriggerNode(node, "github") &&
					node.content.state.status === "configured" && (
						<div className="-mt-[6px]">
							<GitHubTriggerStatusBadge
								flowTriggerId={node.content.state.flowTriggerId}
							/>
						</div>
					)}
				<div className="flex items-center gap-[8px]">
					<div
						className={clsx(
							"w-[32px] h-[32px] flex items-center justify-center rounded-[8px] padding-[8px]",
							"group-data-[content-type=text]:bg-text-node-1",
							"group-data-[content-type=file]:bg-file-node-1",
							"group-data-[content-type=webPage]:bg-webPage-node-1",
							"group-data-[content-type=textGeneration]:bg-generation-node-1",
							"group-data-[content-type=imageGeneration]:bg-image-generation-node-1",
							"group-data-[content-type=github]:bg-github-node-1",
							"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=github]:bg-github-node-1",
							"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=githubPullRequest]:bg-github-node-1",
							"group-data-[content-type=webSearch]:bg-web-search-node-1",
							"group-data-[content-type=audioGeneration]:bg-audio-generation-node-1",
							"group-data-[content-type=videoGeneration]:bg-video-generation-node-1",
							"group-data-[content-type=trigger]:bg-trigger-node-1",
							"group-data-[content-type=action]:bg-action-node-1",
							"group-data-[content-type=query]:bg-query-node-1",
						)}
					>
						<NodeIcon
							node={node}
							className={clsx(
								"w-[16px] h-[16px]",
								"group-data-[content-type=text]:fill-current",
								"group-data-[content-type=file]:fill-current",
								"group-data-[content-type=webPage]:fill-current",
								"group-data-[content-type=textGeneration]:stroke-current fill-none",
								"group-data-[content-type=imageGeneration]:stroke-current fill-none",
								"group-data-[content-type=github]:fill-current",
								"group-data-[content-type=vectorStore]:fill-current",
								"group-data-[content-type=webSearch]:stroke-current fill-none",
								"group-data-[content-type=audioGeneration]:stroke-current fill-none",
								"group-data-[content-type=videoGeneration]:stroke-current fill-none",
								"group-data-[content-type=trigger]:stroke-current fill-none",
								"group-data-[content-type=action]:fill-current",
								"group-data-[content-type=query]:stroke-current fill-none",
								"group-data-[content-type=text]:text-black-900",
								"group-data-[content-type=file]:text-black-900",
								"group-data-[content-type=webPage]:text-black-900",
								"group-data-[content-type=textGeneration]:text-white-900",
								"group-data-[content-type=imageGeneration]:text-white-900",
								"group-data-[content-type=github]:text-white-900",
								"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=github]:text-white-900",
								"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=githubPullRequest]:text-white-900",
								"group-data-[content-type=webSearch]:text-white-900",
								"group-data-[content-type=audioGeneration]:text-white-900",
								"group-data-[content-type=videoGeneration]:text-white-900",
								"group-data-[content-type=trigger]:text-white-900",
								"group-data-[content-type=action]:text-white-900",
								"group-data-[content-type=query]:text-black-900",
							)}
						/>
					</div>
					<div>
						<div className="flex items-center gap-[2px] pl-[4px] text-[10px] font-mono [&>*:not(:last-child)]:after:content-['/'] [&>*:not(:last-child)]:after:ml-[2px] [&>*:not(:last-child)]:after:text-white-300">
							{metadataTexts.map((item, _index) => (
								<div key={item.label} className="text-[10px] text-white-400">
									{selected ? (
										<Tooltip text={item.tooltip} variant="dark">
											<button type="button">{item.label}</button>
										</Tooltip>
									) : (
										item.label
									)}
								</div>
							))}
						</div>
						<EditableText
							className="group-data-[selected=false]:pointer-events-none **:data-input:w-full"
							text={defaultName(node)}
							onValueChange={(value) => {
								if (value === defaultName(node)) {
									return;
								}
								if (value.trim().length === 0) {
									updateNodeData(node.id, { name: undefined });
									return;
								}
								updateNodeData(node.id, { name: value });
							}}
							onClickToEditMode={(e) => {
								if (!selected) {
									e.preventDefault();
									return;
								}
								e.stopPropagation();
							}}
						/>
					</div>
				</div>
			</div>
			<GitHubNodeInfo node={node} />
			{!preview && (
				<div className="flex justify-between">
					<div className="grid">
						{node.content.type !== "action" &&
							node.inputs?.map((input) => (
								<div
									className="relative flex items-center h-[28px]"
									key={input.id}
								>
									<Handle
										type="target"
										isConnectable={false}
										position={Position.Left}
										id={input.id}
										className={clsx(
											"!absolute !w-[11px] !h-[11px] !rounded-full !-left-[4.5px] !translate-x-[50%] !border-[1.5px]",
											"group-data-[content-type=textGeneration]:!bg-generation-node-1 group-data-[content-type=textGeneration]:!border-generation-node-1",
											"group-data-[content-type=imageGeneration]:!bg-image-generation-node-1 group-data-[content-type=imageGeneration]:!border-image-generation-node-1",
											"group-data-[content-type=webSearch]:!bg-web-search-node-1 group-data-[content-type=webSearch]:!border-web-search-node-1",
											"group-data-[content-type=audioGeneration]:!bg-audio-generation-node-1 group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
											"group-data-[content-type=videoGeneration]:!bg-video-generation-node-1 group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
											"group-data-[content-type=query]:!bg-query-node-1 group-data-[content-type=query]:!border-query-node-1",
										)}
									/>
									<div className={clsx("px-[12px] text-white-900 text-[12px]")}>
										{input.label}
									</div>
								</div>
							))}
						{node.content.type === "action" &&
							node.inputs.map((input) => (
								<div
									className="relative flex items-center h-[28px] group"
									key={input.id}
									data-state={
										connectedInputIds?.some(
											(connectedInputId) => connectedInputId === input.id,
										)
											? "connected"
											: "disconnected"
									}
									data-required={input.isRequired ? "true" : "false"}
								>
									<Handle
										type="target"
										isConnectable={
											!connectedInputIds?.some(
												(connectedInputId) => connectedInputId === input.id,
											)
										}
										position={Position.Left}
										id={input.id}
										className={clsx(
											"!absolute !w-[11px] !h-[11px] !rounded-full !-left-[4.5px] !translate-x-[50%] !border-[1.5px]",
											"group-data-[content-type=action]:!bg-action-node-1 group-data-[content-type=action]:!border-action-node-1",
											"group-data-[state=disconnected]:!bg-black-900",
										)}
									/>
									<div
										className={clsx(
											"px-[12px] text-white-900 text-[12px]",
											"group-data-[state=connected]:px-[16px]",
											"group-data-[state=disconnected]:absolute group-data-[state=disconnected]:-left-[4.5px] group-data-[state=disconnected]:whitespace-nowrap group-data-[state=disconnected]:-translate-x-[100%]",
											"group-data-[state=connected]:text-white-900 group-data-[state=disconnected]:text-black-400",
											"group-data-[state=disconnected]:group-data-[required=true]:text-red-900",
										)}
									>
										{input.label}
									</div>
								</div>
							))}
						{node.type === "operation" &&
							node.content.type !== "trigger" &&
							node.content.type !== "action" && (
								<div
									className="relative flex items-center h-[28px]"
									key="blank"
								>
									<Handle
										type="target"
										position={Position.Left}
										id="blank-handle"
										className={clsx(
											"!absolute !w-[11px] !h-[11px] !rounded-full !-left-[4.5px] !translate-x-[50%] !border-[1.5px] !bg-black-900",
											"group-data-[content-type=textGeneration]:!border-generation-node-1",
											"group-data-[content-type=imageGeneration]:!border-image-generation-node-1",
											"group-data-[content-type=webSearch]:!border-web-search-node-1",
											"group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
											"group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
											"group-data-[content-type=query]:!border-query-node-1",
										)}
									/>
									<div className="absolute left-[-12px] text-[12px] text-black-400 whitespace-nowrap -translate-x-[100%]">
										Input
									</div>
								</div>
							)}
					</div>

					<div className="grid">
						{node.outputs?.map((output) => (
							<div
								className="relative group flex items-center h-[28px]"
								key={output.id}
								data-state={
									connectedOutputIds?.some(
										(connectedOutputId) => connectedOutputId === output.id,
									)
										? "connected"
										: "disconnected"
								}
							>
								<Handle
									id={output.id}
									type="source"
									position={Position.Right}
									className={clsx(
										"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !right-[-0.5px]",
										"group-data-[content-type=textGeneration]:!border-generation-node-1",
										"group-data-[content-type=imageGeneration]:!border-image-generation-node-1",
										"group-data-[content-type=github]:!border-github-node-1",
										"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=github]:!border-github-node-1",
										"group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=githubPullRequest]:!border-github-node-1",
										"group-data-[content-type=text]:!border-text-node-1",
										"group-data-[content-type=file]:!border-file-node-1",
										"group-data-[content-type=webPage]:!border-webPage-node-1",
										"group-data-[content-type=webPage]:!border-webPage-node-1",
										"group-data-[content-type=webSearch]:!border-web-search-node-1",
										"group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
										"group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
										"group-data-[content-type=trigger]:!border-trigger-node-1",
										"group-data-[content-type=action]:!border-action-node-1",
										"group-data-[content-type=query]:!border-query-node-1",
										"group-data-[state=connected]:group-data-[content-type=textGeneration]:!bg-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=imageGeneration]:!bg-image-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=github]:!bg-github-node-1",
										"group-data-[state=connected]:group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=github]:!bg-github-node-1",
										"group-data-[state=connected]:group-data-[content-type=vectorStore]:group-data-[vector-store-source-provider=githubPullRequest]:!bg-github-node-1",
										"group-data-[state=connected]:group-data-[content-type=text]:!bg-text-node-1 group-data-[state=connected]:group-data-[content-type=text]:!border-text-node-1",
										"group-data-[state=connected]:group-data-[content-type=file]:!bg-file-node-1 group-data-[state=connected]:group-data-[content-type=file]:!border-file-node-1",
										"group-data-[state=connected]:group-data-[content-type=webPage]:!bg-webPage-node-1 group-data-[state=connected]:group-data-[content-type=webPage]:!border-webPage-node-1",
										"group-data-[state=connected]:group-data-[content-type=webSearch]:!bg-web-search-node-1 group-data-[state=connected]:group-data-[content-type=webSearch]:!border-web-search-node-1",
										"group-data-[state=connected]:group-data-[content-type=audioGeneration]:!bg-audio-generation-node-1 group-data-[state=connected]:group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=videoGeneration]:!bg-video-generation-node-1 group-data-[state=connected]:group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=trigger]:!bg-trigger-node-1 group-data-[state=connected]:group-data-[content-type=trigger]:!border-trigger-node-1",
										"group-data-[state=connected]:group-data-[content-type=action]:!bg-action-node-1 group-data-[state=connected]:group-data-[content-type=action]:!border-action-node-1",
										"group-data-[state=connected]:group-data-[content-type=query]:!bg-query-node-1 group-data-[state=connected]:group-data-[content-type=query]:!border-query-node-1",
										"group-data-[state=disconnected]:!bg-black-900",
									)}
								/>
								<div
									className={clsx(
										"text-[12px]",
										"group-data-[state=connected]:px-[16px]",
										"group-data-[state=disconnected]:absolute group-data-[state=disconnected]:-right-[12px] group-data-[state=disconnected]:whitespace-nowrap group-data-[state=disconnected]:translate-x-[100%]",
										"group-data-[state=connected]:text-white-900 group-data-[state=disconnected]:text-black-400",
									)}
								>
									{output.label}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
