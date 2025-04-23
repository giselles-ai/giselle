import {
	FileNode,
	GitHubNode,
	ImageGenerationNode,
	type Node,
	type OutputId,
	TextGenerationNode,
	TextNode,
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
import { useEffect, useMemo, useState } from "react";
import { NodeIcon } from "../../icons/node";
import { EditableText } from "../../ui/editable-text";
import ShinyText from "../../ui/shiny-text";
import { defaultName } from "../../utils";
import { CheckCircleIcon, AlertCircleIcon, PlayCircleIcon, StopCircleIcon, RefreshCcwIcon, Square, Check } from "lucide-react";

// Definition of NodeStatus type used internally
type NodeStatus = "idle" | "running" | "completed" | "failed" | "selected";

// Color definitions used for execution state display
const NODE_COLORS = {
	BLUE: '#3b82f6',    // Blue for running state
	GREEN: '#39FF7F',   // Green for completed state
	RED: '#FF3D71',     // Red for error state
};

/**
 * Node theme definitions for different node types
 * - When adding a new node type, add a new entry here with all required color values
 * - Then update the class names in the respective components below
 * 
 * Example usage:
 * - For CSS classes: data-[content-type=newNodeType]:from-${NODE_THEME.newNodeType.from}]
 */
const NODE_THEME = {
	text: {
		from: 'text-node-1',
		to: 'text-node-2',
		shadow: 'text-node-1',
		iconBg: 'text-node-1',
		iconText: 'black-900',
		border: 'text-node-1'
	},
	file: {
		from: 'file-node-1',
		to: 'file-node-2',
		shadow: 'file-node-1',
		iconBg: 'file-node-1',
		iconText: 'black-900',
		border: 'file-node-1'
	},
	textGeneration: {
		from: 'generation-node-1',
		to: 'generation-node-2',
		shadow: 'generation-node-1',
		iconBg: 'generation-node-1',
		iconText: 'white-900',
		border: 'generation-node-1'
	},
	imageGeneration: {
		from: 'image-generation-node-1',
		to: 'image-generation-node-2',
		shadow: 'image-generation-node-1',
		iconBg: 'image-generation-node-1',
		iconText: 'white-900',
		border: 'image-generation-node-1'
	},
	webSearch: {
		from: 'web-search-node-1',
		to: 'web-search-node-2',
		shadow: 'web-search-node-1',
		iconBg: 'web-search-node-1',
		iconText: 'white-900',
		border: 'web-search-node-1'
	},
	github: {
		from: 'github-node-1',
		to: 'github-node-2',
		shadow: 'github-node-1',
		iconBg: 'github-node-1',
		iconText: 'white-900',
		border: 'github-node-1'
	},
	audioGeneration: {
		from: 'audio-generation-node-1',
		to: 'audio-generation-node-2',
		shadow: 'audio-generation-node-1',
		iconBg: 'audio-generation-node-1',
		iconText: 'white-900',
		border: 'audio-generation-node-1'
	},
	videoGeneration: {
		from: 'video-generation-node-1',
		to: 'video-generation-node-2',
		shadow: 'video-generation-node-1',
		iconBg: 'video-generation-node-1',
		iconText: 'white-900',
		border: 'video-generation-node-1'
	}
};

/**
 * Determines the priority node type when a node has multiple capabilities
 * Priority order: textGeneration > webSearch > imageGeneration > others
 * 
 * @param node - The node to check
 * @returns The highest priority node type for styling
 */
function getPriorityNodeType(node: Node): string {
	// まずノードの基本タイプを取得
	const contentType = node.content.type;
	
	// テキスト生成ノードの場合、モデルに基づいて特殊判定
	if (contentType === "textGeneration" && node.content.llm) {
		const { provider, id } = node.content.llm;
		
		// Web検索機能を持つモデル判定（Perplexity sonar-pro）
		if (provider === "perplexity" && id === "sonar-pro") {
			return "webSearch"; // Web検索ノードとして扱う
		}
		
		// 画像生成機能を持つモデル判定（OpenAI DALL-E等）
		if (provider === "openai" && id.includes("dall-e")) {
			return "imageGeneration"; // 画像生成ノードとして扱う
		}
		
		// 音声生成機能を持つモデル判定
		if (provider === "openai" && id.includes("tts")) {
			return "audioGeneration"; // 音声生成ノードとして扱う
		}
		
		// 動画生成機能を持つモデル判定
		if (provider === "openai" && id.includes("sora")) {
			return "videoGeneration"; // 動画生成ノードとして扱う
		}
	}
	
	// 画像生成ノードの場合
	if (contentType === "imageGeneration") {
		return "imageGeneration";
	}
	
	// デフォルトはコンテンツタイプをそのまま返す
	return contentType;
}

type GiselleWorkflowDesignerTextGenerationNode = XYFlowNode<
	{ nodeData: TextGenerationNode; preview?: boolean },
	TextGenerationNode["content"]["type"]
>;
type GiselleWorkflowDesignerImageGenerationNode = XYFlowNode<
	{ nodeData: ImageGenerationNode; preview?: boolean },
	TextGenerationNode["content"]["type"]
>;
type GiselleWorkflowDesignerTextNode = XYFlowNode<
	{ nodeData: TextNode; preview?: boolean },
	TextNode["content"]["type"]
>;
type GiselleWorkflowDesignerFileNode = XYFlowNode<
	{ nodeData: FileNode; preview?: boolean },
	FileNode["content"]["type"]
>;
type GiselleWorkflowGitHubNode = XYFlowNode<
	{ nodeData: GitHubNode; preview?: boolean },
	FileNode["content"]["type"]
>;
export type GiselleWorkflowDesignerNode =
	| GiselleWorkflowDesignerTextGenerationNode
	| GiselleWorkflowDesignerImageGenerationNode
	| GiselleWorkflowDesignerTextNode
	| GiselleWorkflowDesignerFileNode
	| GiselleWorkflowGitHubNode;

export const nodeTypes: NodeTypes = {
	[TextGenerationNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[ImageGenerationNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[TextNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[FileNode.shape.content.shape.type.value]: CustomXyFlowNode,
	[GitHubNode.shape.content.shape.type.value]: CustomXyFlowNode,
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

	// State for managing node execution status
	const [executionStatus, setExecutionStatus] = useState<NodeStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
	const [progress, setProgress] = useState<number | undefined>(undefined);
	const [fadeOutOpacity, setFadeOutOpacity] = useState(1); // Opacity control

	// Fade out completed state after 5 seconds, then return to idle
	useEffect(() => {
		let fadeTimer: NodeJS.Timeout | null = null;
		let resetTimer: NodeJS.Timeout | null = null;

		if (executionStatus === "completed") {
			// Start fade out after 5 seconds
			fadeTimer = setTimeout(() => {
				// Gradually decrease opacity
				setFadeOutOpacity(0);
				
				// Reset after fade out is complete
				resetTimer = setTimeout(() => {
					setExecutionStatus("idle");
					setFadeOutOpacity(1); // Reset opacity
				}, 500); // Transition duration
				
			}, 5000);
		}
		
		// Cleanup
		return () => {
			if (fadeTimer) clearTimeout(fadeTimer);
			if (resetTimer) clearTimeout(resetTimer);
		};
	}, [executionStatus]);

	const handleStopExecution = () => {
		// Stop node execution
		setExecutionStatus("idle");
		// Real implementation would call API or actual stop processing
	};

	const handleRetryExecution = () => {
		// Retry node execution
		setExecutionStatus("running");
		setErrorMessage(undefined);
		// Real implementation would call API or actual retry processing
	};

	// Function to change execution state externally for testing
	// In actual app, state would be updated from API notifications
	const startExecution = () => {
		setExecutionStatus("running");
		setProgress(0);
		
		// Timer to simulate progress
		let currentProgress = 0;
		const timer = setInterval(() => {
			currentProgress += 10;
			if (currentProgress >= 100) {
				clearInterval(timer);
				setExecutionStatus("completed");
				setProgress(100);
			} else {
				setProgress(currentProgress);
			}
		}, 1000);
	};

	// Function to simulate error state
	const simulateError = () => {
		setExecutionStatus("failed");
		setErrorMessage("An error occurred during execution");
	};

	return (
		<>
			<NodeComponent
				node={data.nodeData}
				selected={selected}
				connectedOutputIds={connectedOutputIds}
				executionStatus={executionStatus}
				errorMessage={errorMessage}
				progress={progress}
				onStopExecution={handleStopExecution}
				onRetryExecution={handleRetryExecution}
				fadeOutOpacity={fadeOutOpacity}
			/>
			{/* Debug controls - would be managed via API in real app */}
			{selected && (
				<div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
					<button 
						onClick={startExecution}
						className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
					>
						Execute
					</button>
					<button 
						onClick={simulateError}
						className="px-2 py-1 bg-red-500 text-white text-xs rounded"
					>
						Error
					</button>
				</div>
			)}
		</>
	);
}

export function NodeComponent({
	node,
	selected,
	connectedOutputIds,
	preview = false,
	executionStatus,
	errorMessage,
	progress,
	onStopExecution,
	onRetryExecution,
	fadeOutOpacity = 1,
}: {
	node: Node;
	selected?: boolean;
	preview?: boolean;
	connectedOutputIds?: OutputId[];
	executionStatus?: NodeStatus;
	errorMessage?: string;
	progress?: number;
	onStopExecution?: () => void;
	onRetryExecution?: () => void;
	fadeOutOpacity?: number;
}) {
	const { updateNodeData } = useWorkflowDesigner();
	
	// State for animation management
	const [shadowSize, setShadowSize] = useState<number>(8);
	
	// Capability-based node type (for styling)
	const priorityNodeType = getPriorityNodeType(node);
	
	// Gradual shadow size change animation only when in running state
	useEffect(() => {
		if (executionStatus !== "running") {
			setShadowSize(8);
			return;
		}
		
		let step = 0;
		const sizes = [8, 20]; // Changes from 8px to 20px
		
		const interval = setInterval(() => {
			step = (step + 1) % sizes.length;
			setShadowSize(sizes[step]);
		}, 500); // Change every 0.5 seconds
		
		return () => clearInterval(interval);
	}, [executionStatus]);
	
	// Generate dynamic shadow style
	const shadowStyle = useMemo(() => {
		// Apply animation shadow for running nodes
		if (executionStatus === "running") {
			const color = `rgba(${parseInt(NODE_COLORS.BLUE.slice(1, 3), 16)}, ${parseInt(NODE_COLORS.BLUE.slice(3, 5), 16)}, ${parseInt(NODE_COLORS.BLUE.slice(5, 7), 16)}, 0.7)`; // Blue shadow
			return {
				boxShadow: `0px 0px ${shadowSize}px 0px ${color}`,
				transition: "box-shadow 0.5s ease"
			};
		}
		// Apply static shadow for completed and error states
		else if (executionStatus === "completed") {
			const color = `rgba(${parseInt(NODE_COLORS.GREEN.slice(1, 3), 16)}, ${parseInt(NODE_COLORS.GREEN.slice(3, 5), 16)}, ${parseInt(NODE_COLORS.GREEN.slice(5, 7), 16)}, 0.5)`;
			return { boxShadow: `0px 0px 16px 0px ${color}` }; // Green shadow
		}
		else if (executionStatus === "failed") {
			const color = `rgba(${parseInt(NODE_COLORS.RED.slice(1, 3), 16)}, ${parseInt(NODE_COLORS.RED.slice(3, 5), 16)}, ${parseInt(NODE_COLORS.RED.slice(5, 7), 16)}, 0.5)`;
			return { boxShadow: `0px 0px 16px 0px ${color}` }; // Red shadow
		}
		// For selected state, use className instead of inline style
		return {};
	}, [executionStatus, shadowSize]);
	
	return (
		<div
			data-type={node.type}
			data-content-type={priorityNodeType}
			data-selected={selected}
			data-preview={preview}
			data-status={executionStatus}
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
				"data-[selected=true]:shadow-[0px_0px_16px_0px]", // Shadow applied for selected state
				"data-[preview=true]:opacity-50",
				"not-data-preview:min-h-[110px]",
			)}
			style={shadowStyle}
		>
			{/* Execution state overlay */}
			{executionStatus && executionStatus !== "idle" && executionStatus !== "selected" && (
				<>
					{executionStatus === "running" && (
						<div className="absolute top-[-28px] left-0 right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]">
							{/* Progress percentage on the left */}
							<span className="text-xs font-medium font-hubot text-blue-500">
								{progress !== undefined ? `${Math.round(progress)}%` : '0%'}
							</span>
							
							{/* Running text and Stop icon on the right */}
							<div className="flex items-center">
								<ShinyText 
									text="Running..." 
									className="text-xs font-medium font-hubot" 
									speed={2}
									style={{
										color: NODE_COLORS.BLUE, // blue-500 (same color as stop icon)
										backgroundImage: 'linear-gradient(120deg, rgba(59, 130, 246, 1) 40%, rgba(255, 255, 255, 0.6) 50%, rgba(59, 130, 246, 1) 60%)'
									}}
								/>
								{onStopExecution && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											onStopExecution();
										}}
										className="ml-1 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
									>
										<Square className="w-2 h-2 text-white" fill="white" />
									</button>
								)}
							</div>
						</div>
					)}
					
					{executionStatus === "completed" && (
						<div 
							className={`absolute top-[-28px] right-0 py-1 px-2 rounded-full z-10 transition-opacity duration-500 ease-in-out ${fadeOutOpacity === 0 ? 'opacity-0' : 'opacity-100'}`} 
							data-status={executionStatus}
						>
							<div className="flex items-center justify-end">
								<span className={`text-xs font-medium font-hubot`} style={{color: NODE_COLORS.GREEN}}>Completed</span>
								<Check className="w-4 h-4 ml-1" style={{color: NODE_COLORS.GREEN}} />
							</div>
						</div>
					)}
					
					{executionStatus === "failed" && (
						<div className="absolute top-[-28px] right-0 py-1 px-2 rounded-full z-10" data-status={executionStatus}>
							<div className="flex items-center justify-end">
								<span className={`text-xs font-medium font-hubot`} style={{color: NODE_COLORS.RED}}>Error</span>
								<AlertCircleIcon className="w-4 h-4 ml-1" style={{color: NODE_COLORS.RED}} />
							</div>
						</div>
					)}
				</>
			)}

			{/* Error message tooltip */}
			{executionStatus === "failed" && errorMessage && (
				<div 
					className="absolute bottom-full left-0 right-0 mb-2 flex w-full p-4 justify-between items-start rounded-lg border backdrop-blur-[8px] text-white-850 text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
					style={{ 
						borderColor: `rgba(${parseInt(NODE_COLORS.RED.slice(1, 3), 16)}, ${parseInt(NODE_COLORS.RED.slice(3, 5), 16)}, ${parseInt(NODE_COLORS.RED.slice(5, 7), 16)}, 0.2)`,
						backgroundColor: `rgba(${parseInt(NODE_COLORS.RED.slice(1, 3), 16)}, ${parseInt(NODE_COLORS.RED.slice(3, 5), 16)}, ${parseInt(NODE_COLORS.RED.slice(5, 7), 16)}, 0.2)`,
						boxShadow: '-2px -1px 0px 0px rgba(0,0,0,0.1), 1px 1px 8px 0px rgba(0,0,0,0.25)'
					}}
				>
					<div>
						<div className="font-medium mb-1">Execution Error: Timeout</div>
						<div>{errorMessage}</div>
					</div>
					{onRetryExecution && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onRetryExecution();
							}}
							className="ml-4 p-1.5 rounded-full transition-colors flex-shrink-0"
							style={{ backgroundColor: NODE_COLORS.RED, color: 'white' }}
						>
							<RefreshCcwIcon className="w-4 h-4" />
						</button>
					)}
				</div>
			)}

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
					"group-data-[status=running]:border-blue-500",
					`group-data-[status=completed]:border`,
					`group-data-[status=failed]:border`,
				)}
				style={{
					...(executionStatus === "completed" ? { borderColor: NODE_COLORS.GREEN } : {}),
					...(executionStatus === "failed" ? { borderColor: NODE_COLORS.RED } : {})
				}}
				data-status={executionStatus}
			/>

			<div className={clsx("px-[16px] relative")}>
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
						{node.type === "action" && (
							<div className="text-[10px] text-white-400">
								{node.content.llm.provider}
							</div>
						)}
					</div>
				</div>
			</div>
			{!preview && (
				<div className="flex justify-between">
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
						{node.type === "action" && (
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
										"group-data-[content-type=videoGeneration]:!border-video-generation-node-1"
									)}
								/>
								<div className="absolute left-[-45px] text-[12px] text-black-400 whitespace-nowrap">
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
										"group-data-[state=connected]:group-data-[content-type=textGeneration]:!bg-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=imageGeneration]:!bg-image-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=github]:!bg-github-node-1",
										"group-data-[state=connected]:group-data-[content-type=text]:!bg-text-node-1 group-data-[state=connected]:group-data-[content-type=text]:!border-text-node-1",
										"group-data-[state=connected]:group-data-[content-type=file]:!bg-file-node-1 group-data-[state=connected]:group-data-[content-type=file]:!border-file-node-1",
										"group-data-[state=connected]:group-data-[content-type=webSearch]:!bg-web-search-node-1 group-data-[state=connected]:group-data-[content-type=webSearch]:!border-web-search-node-1",
										"group-data-[state=connected]:group-data-[content-type=audioGeneration]:!bg-audio-generation-node-1 group-data-[state=connected]:group-data-[content-type=audioGeneration]:!border-audio-generation-node-1",
										"group-data-[state=connected]:group-data-[content-type=videoGeneration]:!bg-video-generation-node-1 group-data-[state=connected]:group-data-[content-type=videoGeneration]:!border-video-generation-node-1",
										"group-data-[state=disconnected]:!bg-black-900",
									)}
								/>
								<div
									className={clsx(
										"text-[12px]",
										"group-data-[state=connected]:px-[16px]",
										"group-data-[state=disconnected]:absolute group-data-[state=disconnected]:right-[-60px] group-data-[state=disconnected]:whitespace-nowrap",
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
