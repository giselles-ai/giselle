import {
	ActionNode,
	FileNode,
	GitHubNode,
	ImageGenerationNode,
	type InputId,
	type Node,
	type OutputId,
	TextGenerationNode,
	TextNode,
	TriggerNode,
} from "@giselle-sdk/data-type";
import {
	Handle,
	type NodeProps,
	type NodeTypes,
	Position,
	type Node as XYFlowNode,
} from "@xyflow/react";
import clsx from "clsx/lite";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { CheckIcon, SquareIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { NodeIcon } from "../../icons/node";
import { EditableText } from "../../ui/editable-text";
import { defaultName } from "../../utils";
import { useDebug } from "../debug-context";
import styles from "./github-trigger-node.module.css";

type GiselleWorkflowDesignerTextGenerationNode = XYFlowNode<
	{ nodeData: TextGenerationNode; preview?: boolean },
	TextGenerationNode["content"]["type"]
>;

type GiselleWorkflowDesignerImageGenerationNode = XYFlowNode<
	{ nodeData: ImageGenerationNode; preview?: boolean },
	ImageGenerationNode["content"]["type"]
>;

type GiselleWorkflowDesignerTextNode = XYFlowNode<
	{ nodeData: TextNode; preview?: boolean },
	TextNode["content"]["type"]
>;

type GiselleWorkflowDesignerFileNode = XYFlowNode<
	{ nodeData: FileNode; preview?: boolean },
	FileNode["content"]["type"]
>;

type GiselleWorkflowDesignerGitHubNode = XYFlowNode<
	{ nodeData: GitHubNode; preview?: boolean },
	GitHubNode["content"]["type"]
>;

type GiselleWorkflowTriggerNode = XYFlowNode<
	{ nodeData: TriggerNode; preview?: boolean },
	TriggerNode["content"]["type"]
>;

type GiselleWorkflowActionNode = XYFlowNode<
	{ nodeData: ActionNode; preview?: boolean },
	ActionNode["content"]["type"]
>;

export type GiselleWorkflowDesignerNode =
	| GiselleWorkflowDesignerTextGenerationNode
	| GiselleWorkflowDesignerImageGenerationNode
	| GiselleWorkflowDesignerTextNode
	| GiselleWorkflowDesignerFileNode
	| GiselleWorkflowDesignerGitHubNode
	| GiselleWorkflowTriggerNode
	| GiselleWorkflowActionNode;

export const nodeTypes: NodeTypes = {
	[TextGenerationNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[ImageGenerationNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[TextNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[FileNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[GitHubNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[TriggerNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[ActionNode.shape.content.shape.type.value]: CustomXyFlowNode,
};

export function CustomXyFlowNode({
	data,
	selected,
}: NodeProps<GiselleWorkflowDesignerNode>) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const connectedInputIds = useMemo(
		() =>
			workspace.connections
				.filter((connection) => connection.inputNode.id === data.nodeData.id)
				.map((connection) => connection.inputId),
		[workspace, data.nodeData.id],
	);
	const connectedOutputIds = useMemo(
		() =>
			workspace.connections
				.filter((connection) => connection.outputNode.id === data.nodeData.id)
				.map((connection) => connection.outputId),
		[workspace, data.nodeData.id],
	);

	return (
		<NodeComponent
			node={data.nodeData}
			selected={selected}
			connectedInputIds={connectedInputIds}
			connectedOutputIds={connectedOutputIds}
		/>
	);
}

export function NodeComponent({
	node,
	selected,
	connectedInputIds,
	connectedOutputIds,
	preview = false,
}: {
	node: Node;
	selected?: boolean;
	preview?: boolean;
	connectedInputIds?: InputId[];
	connectedOutputIds?: OutputId[];
}) {
	const { updateNodeData, data } = useWorkflowDesigner();
	const { githubAuthState, setGithubAuthState } = useDebug();
	const { stopGeneration, currentGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "workspace", id: data.id },
	});
	const [prevGenerationStatus, setPrevGenerationStatus] = useState(
		currentGeneration?.status,
	);
	const [showCompleteLabel, startTransition] = useTransition();
	
	// Check if it's a GitHub trigger node
	const isGitHubTriggerNode = 
		node.type === "action" && 
		node.content.type === "trigger" && 
		(node.content.provider as any)?.type === "github";
	
	// Determine whether to display repository information
	const showRepositoryInfo = isGitHubTriggerNode && githubAuthState === 'installed';
	
	useEffect(() => {
		if (currentGeneration === undefined) {
			return;
		}
		if (
			prevGenerationStatus === "running" &&
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
		setPrevGenerationStatus(currentGeneration.status);
	}, [currentGeneration, prevGenerationStatus]);
	
	return (
		<div
			data-type={node.type}
			data-content-type={node.content.type}
			data-selected={selected}
			data-preview={preview}
			data-current-generation-status={currentGeneration?.status}
			className={clsx(
				"group relative flex flex-col rounded-[16px] py-[16px] gap-[16px] min-w-[180px]",
				"bg-gradient-to-tl transition-all backdrop-blur-[4px]",
				"data-[content-type=text]:from-text-node-1] data-[content-type=text]:to-text-node-2 data-[content-type=text]:shadow-text-node-1",
				"data-[content-type=file]:from-file-node-1] data-[content-type=file]:to-file-node-2 data-[content-type=file]:shadow-file-node-1",
				"data-[content-type=textGeneration]:from-generation-node-1] data-[content-type=textGeneration]:to-generation-node-2 data-[content-type=textGeneration]:shadow-generation-node-1",
				"data-[content-type=imageGeneration]:from-image-generation-node-1] data-[content-type=imageGeneration]:to-image-generation-node-2 data-[content-type=imageGeneration]:shadow-image-generation-node-1",
				"data-[content-type=github]:from-github-node-1] data-[content-type=github]:to-github-node-2 data-[content-type=github]:shadow-github-node-1",
				"data-[content-type=webSearch]:from-web-search-node-1] data-[content-type=webSearch]:to-web-search-node-2 data-[content-type=webSearch]:shadow-web-search-node-1",
				"data-[content-type=audioGeneration]:from-audio-generation-node-1] data-[content-type=audioGeneration]:to-audio-generation-node-2 data-[content-type=audioGeneration]:shadow-audio-generation-node-1",
				"data-[content-type=videoGeneration]:from-video-generation-node-1] data-[content-type=videoGeneration]:to-video-generation-node-2 data-[content-type=videoGeneration]:shadow-video-generation-node-1",
				"data-[content-type=trigger]:from-trigger-node-1] data-[content-type=trigger]:to-trigger-node-2 data-[content-type=trigger]:shadow-trigger-node-1",
				"data-[content-type=action]:from-action-node-1] data-[content-type=action]:to-action-node-2 data-[content-type=action]:shadow-action-node-1",
				"data-[content-type=trigger]:border-[1px] data-[content-type=trigger]:border-solid data-[content-type=trigger]:border-black-400 data-[content-type=trigger]:bg-black-400-20 data-[content-type=trigger]:backdrop-blur-[2px]",
				"data-[selected=true]:shadow-[0px_0px_16px_0px]",
				"data-[preview=true]:opacity-50",
				"not-data-preview:min-h-[110px]",
				isGitHubTriggerNode && styles.githubTriggerNode
			)}
		>
			{currentGeneration?.status === "created" &&
				node.content.type !== "trigger" && (
					<div className="absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]">
						<div className="flex items-center">
							<p className="text-xs font-medium font-hubot text-black-200">
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
							<p className="text-xs font-medium font-hubot bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[rgba(59,_130,_246,_1)] via-[rgba(255,_255,_255,_0.5)] to-[rgba(59,_130,_246,_1)] text-transparent animate-shimmer">
								Generating...
							</p>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									stopGeneration();
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
							<p className="text-xs font-medium font-hubot">Completed</p>
							<CheckIcon className="w-4 h-4" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<div
				className={clsx(
					"absolute z-0 rounded-[16px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder border-transparent",
					"group-data-[content-type=text]:from-text-node-1/40 group-data-[content-type=text]:to-text-node-1",
					"group-data-[content-type=file]:from-file-node-1/40 group-data-[content-type=file]:to-file-node-1",
					"group-data-[content-type=textGeneration]:from-generation-node-1/40 group-data-[content-type=textGeneration]:to-generation-node-1",
					"group-data-[content-type=imageGeneration]:from-image-generation-node-1/40 group-data-[content-type=imageGeneration]:to-image-generation-node-1",
					"group-data-[content-type=github]:from-github-node-1/40 group-data-[content-type=github]:to-github-node-1",
					"group-data-[content-type=webSearch]:from-web-search-node-1/40 group-data-[content-type=webSearch]:to-web-search-node-1",
					"group-data-[content-type=audioGeneration]:from-audio-generation-node-1/40 group-data-[content-type=audioGeneration]:to-audio-generation-node-1",
					"group-data-[content-type=videoGeneration]:from-video-generation-node-1/40 group-data-[content-type=videoGeneration]:to-video-generation-node-1",
					"group-data-[content-type=trigger]:from-trigger-node-1/40 group-data-[content-type=trigger]:to-trigger-node-1",
					"group-data-[content-type=action]:from-action-node-1/40 group-data-[content-type=action]:to-action-node-1",
					"group-data-[content-type=trigger]:hidden",
				)}
			/>

			<div className={clsx(
				"px-[16px] relative",
				isGitHubTriggerNode && styles.nodeTitle
			)}>
				<div className="flex items-center gap-[8px]">
					<div
						className={clsx(
							"w-[32px] h-[32px] flex items-center justify-center rounded-[8px] padding-[8px]",
							"group-data-[content-type=text]:bg-text-node-1",
							"group-data-[content-type=file]:bg-file-node-1",
							"group-data-[content-type=textGeneration]:bg-generation-node-1",
							"group-data-[content-type=imageGeneration]:bg-image-generation-node-1",
							"group-data-[content-type=github]:bg-github-node-1",
							"group-data-[content-type=webSearch]:bg-web-search-node-1",
							"group-data-[content-type=audioGeneration]:bg-audio-generation-node-1",
							"group-data-[content-type=videoGeneration]:bg-video-generation-node-1",
							"group-data-[content-type=trigger]:bg-trigger-node-1",
							"group-data-[content-type=action]:bg-action-node-1",
						)}
					>
						<NodeIcon
							node={node}
							className={clsx(
								"w-[16px] h-[16px] fill-current",
								"group-data-[content-type=text]:text-black-900",
								"group-data-[content-type=file]:text-black-900",
								"group-data-[content-type=textGeneration]:text-white-900",
								"group-data-[content-type=imageGeneration]:text-white-900",
								"group-data-[content-type=github]:text-white-900",
								"group-data-[content-type=webSearch]:text-white-900",
								"group-data-[content-type=audioGeneration]:text-white-900",
								"group-data-[content-type=videoGeneration]:text-white-900",
								"group-data-[content-type=trigger]:text-white-900",
								"group-data-[content-type=action]:text-white-900",
							)}
						/>
					</div>
					<div>
						<EditableText
							className="group-data-[selected=false]:pointer-events-none **:data-input:w-full"
							text={defaultName(node)}
							onValueChange={(value) => {
								if (value === defaultName(node)) {
									return;
								}
								if (value.trim().length === 0) {
									updateNodeData(node, { name: undefined });
									return;
								}
								updateNodeData(node, { name: value });
							}}
							onClickToEditMode={(e) => {
								if (!selected) {
									e.preventDefault();
									return;
								}
								e.stopPropagation();
							}}
						/>
						{node.type === "operation" &&
							(node.content.type === "imageGeneration" ||
								node.content.type === "textGeneration") && (
								<div className="text-[10px] text-white-400 pl-[4px]">
									{node.content.llm.provider}
								</div>
							)}
					</div>
				</div>
			</div>
			
			{/* Repository information display - For GitHub trigger nodes */}
			{showRepositoryInfo && (
				<div className={clsx(
					"mx-4 py-2 rounded-lg",
					isGitHubTriggerNode && styles.repoInfo
				)}>
					<div className="flex px-[10px] py-[4px] items-center gap-[8px] rounded-[16px] bg-black-850">
						<svg className="w-4 h-4 text-white-900" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						<span className="text-[12px] font-medium text-black-200 font-geist leading-[170%]">route06/giselle-service-website</span>
					</div>
					<div className="pt-2">
						<div className="text-[12px] font-medium text-white-850 font-geist leading-[170%] px-2">
							<div>Merge pull request #1169 from</div>
							<div>route06/deep-learning</div>
						</div>
					</div>
				</div>
			)}

			{/* Display for unauthorized and not-installed states */}
			{isGitHubTriggerNode && (githubAuthState === 'unauthorized' || githubAuthState === 'not-installed') && (
				<div className="mx-4 py-2">
					<button 
						className="flex px-4 py-1 justify-center items-center gap-2.5 self-stretch rounded-2xl border border-[#64759B] text-[#64759B] hover:bg-black-800/30 transition-colors w-full"
						onClick={() => setGithubAuthState('installed')}
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						<span className="font-['Hubot_Sans'] text-[12px] font-medium leading-normal">Connect Repository</span>
					</button>
				</div>
			)}

			
			{!preview　&& githubAuthState === 'installed' && (
				<div className={clsx(
					"flex justify-between",
					isGitHubTriggerNode && styles.nodeConnectors
				)}>
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
										"group-data-[content-type=text]:!border-text-node-1",
										"group-data-[content-type=file]:!border-file-node-1",
										"group-data-[content-type=webSearch]:!border-web-search-node-1",
										"group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
										"group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
										"group-data-[content-type=trigger]:!border-trigger-node-1",
										"group-data-[state=connected]:group-data-[content-type=textGeneration]:!bg-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=imageGeneration]:!bg-image-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=github]:!bg-github-node-1",
										"group-data-[state=connected]:group-data-[content-type=text]:!bg-text-node-1 group-data-[state=connected]:group-data-[content-type=text]:!border-text-node-1",
										"group-data-[state=connected]:group-data-[content-type=file]:!bg-file-node-1 group-data-[state=connected]:group-data-[content-type=file]:!border-file-node-1",
										"group-data-[state=connected]:group-data-[content-type=webSearch]:!bg-web-search-node-1 group-data-[state=connected]:group-data-[content-type=webSearch]:!border-web-search-node-1",
										"group-data-[state=connected]:group-data-[content-type=audioGeneration]:!bg-audio-generation-node-1 group-data-[state=connected]:group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=videoGeneration]:!bg-video-generation-node-1 group-data-[state=connected]:group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=trigger]:!bg-trigger-node-1 group-data-[state=connected]:group-data-[content-type=trigger]:!border-trigger-node-1",
										"group-data-[state=disconnected]:!bg-black-900",
										isGitHubTriggerNode && styles.handle
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
			
			{/* Debug controls for GitHub trigger node */}
			{isGitHubTriggerNode && !preview && (
				<div className={clsx(
					"mt-2 mx-4 pt-2 border-t border-white-900/10",
					styles.debugControls
				)}>
					<div className="flex flex-wrap gap-1">
						<button
							className="px-1 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded hover:bg-red-500/30"
							onClick={() => setGithubAuthState('unauthorized')}
						>
							Unauthorized
						</button>
						<button
							className="px-1 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] rounded hover:bg-yellow-500/30"
							onClick={() => setGithubAuthState('not-installed')}
						>
							Not Installed
						</button>
						<button
							className="px-1 py-0.5 bg-green-500/20 text-green-300 text-[10px] rounded hover:bg-green-500/30"
							onClick={() => setGithubAuthState('installed')}
						>
							Selected
						</button>
					</div>
					{/* Display current debug state */}
					{githubAuthState !== 'default' && (
						<div className="mt-1 text-[10px] text-white-500/70">
							Debug State: {
								githubAuthState === 'unauthorized' ? 'Unauthorized' :
								githubAuthState === 'not-installed' ? 'Not Installed' :
								'Selected'
							}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
