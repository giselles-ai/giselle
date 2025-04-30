import {
	FileNode,
	GitHubNode,
	ImageGenerationNode,
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
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo, useState } from "react";
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

export type GiselleWorkflowDesignerNode =
	| GiselleWorkflowDesignerTextGenerationNode
	| GiselleWorkflowDesignerImageGenerationNode
	| GiselleWorkflowDesignerTextNode
	| GiselleWorkflowDesignerFileNode
	| GiselleWorkflowDesignerGitHubNode
	| GiselleWorkflowTriggerNode;

export const nodeTypes: NodeTypes = {
	[TextGenerationNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[ImageGenerationNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[TextNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[FileNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[GitHubNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[TriggerNode.shape.content.shape.type.value]: CustomXyFlowNode,
};

export function CustomXyFlowNode({
	data,
	selected,
}: NodeProps<GiselleWorkflowDesignerNode>) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const hasTarget = useMemo(
		() =>
			workspace.connections.some(
				(connection) => connection.outputNode.id === data.nodeData.id,
			),
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
			connectedOutputIds={connectedOutputIds}
		/>
	);
}

export function NodeComponent({
	node,
	selected,
	connectedOutputIds,
	preview = false,
}: {
	node: Node;
	selected?: boolean;
	preview?: boolean;
	connectedOutputIds?: OutputId[];
}) {
	const { updateNodeData } = useWorkflowDesigner();
	const { githubAuthState, setGithubAuthState } = useDebug();
	
	// GitHubトリガーノードかどうかを確認
	const isGitHubTriggerNode = 
		node.type === "action" && 
		node.content.type === "trigger" && 
		(node.content.provider as any)?.type === "github";
	
	// リポジトリ情報を表示するかどうか
	const showRepositoryInfo = isGitHubTriggerNode && githubAuthState === 'installed';
	
	return (
		<div
			data-type={node.type}
			data-content-type={node.content.type}
			data-selected={selected}
			data-preview={preview}
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
				"data-[content-type=trigger]:border-[1px] data-[content-type=trigger]:border-solid data-[content-type=trigger]:border-black-400 data-[content-type=trigger]:bg-black-400-20 data-[content-type=trigger]:backdrop-blur-[2px]",
				"data-[selected=true]:shadow-[0px_0px_16px_0px]",
				"data-[preview=true]:opacity-50",
				"not-data-preview:min-h-[110px]",
				isGitHubTriggerNode && styles.githubTriggerNode
			)}
		>
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
							"group-data-[content-type=trigger]:bg-black-400",
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
						{node.type === "action" &&
							(node.content.type === "imageGeneration" ||
								node.content.type === "textGeneration") && (
								<div className="text-[10px] text-white-400 pl-[4px]">
									{node.content.llm.provider}
								</div>
							)}
					</div>
				</div>
			</div>
			
			{/* リポジトリ情報表示 - GitHubトリガーノードの場合 */}
			{showRepositoryInfo && (
				<div className={clsx(
					"mx-4 px-3 py-2 bg-black-800/40 rounded-lg border border-white-900/10",
					isGitHubTriggerNode && styles.repoInfo
				)}>
					<div className="flex items-center gap-2 mb-2">
						<svg className="w-4 h-4 text-white-900" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						<span className="text-[12px] font-medium text-white-900">route06/giselle-service-website</span>
					</div>
					<div className="flex items-start gap-2 border-t border-white-900/10 pt-2">
						<svg className="w-4 h-4 text-white-900 mt-[2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M6 6l6 6l6-6" />
							<path d="M12 12v6" />
						</svg>
						<div className="text-[11px] text-white-400">
							<div>Merge pull request #1169 from</div>
							<div className="text-white-900">route06/deep-learning</div>
						</div>
					</div>
				</div>
			)}

			
			{!preview　&& githubAuthState === 'installed' && (
				<div className={clsx(
					"flex justify-between",
					isGitHubTriggerNode && styles.nodeConnectors
				)}>
					<div className="grid">
						{node.inputs?.map((input) => (
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
						{node.type === "action" && node.content.type !== "trigger" && (
							<div className="relative flex items-center h-[28px]" key="blank">
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
			
			{/* GitHubトリガーノード用デバッグコントロール */}
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
					{/* 選択中のデバッグ状態を表示 */}
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
