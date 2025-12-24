import { defaultName } from "@giselles-ai/node-registry";
import {
	type InputId,
	isActionNode,
	isAppEntryNode,
	isImageGenerationNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
	type NodeId,
	type NodeLike,
	type OutputId,
} from "@giselles-ai/protocol";
import {
	Handle,
	type NodeProps,
	type NodeTypes,
	Position,
} from "@xyflow/react";
import clsx from "clsx/lite";
import { CheckIcon, SquareIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useAppDesignerStore } from "../../app-designer";
import { NodeIcon } from "../../icons/node";
import { EditableText } from "../../ui/editable-text";
import { NodeHandleDot } from "../../ui/node/node-handle-dot";
import { NodeInputLabel } from "../../ui/node/node-input-label";
import { Tooltip } from "../../ui/tooltip";
import {
	STAGE_NODE_BG_CLASS,
	STAGE_NODE_BORDER_CLASS,
	STAGE_NODE_COLOR_VAR,
	STAGE_NODE_HANDLE_BG_CLASS,
	useNodeGenerationStatus,
} from "./node-utils";
import { DocumentNodeInfo, GitHubNodeInfo } from "./ui";
import { GitHubTriggerStatusBadge } from "./ui/github-trigger/status-badge";

type NodeHandleContentType = Parameters<typeof NodeHandleDot>[0]["contentType"];

function getInputHandleContentType(node: NodeLike): NodeHandleContentType {
	// Allow upcoming content types without forcing every caller to loosen their typing.
	const contentType = node.content.type as
		| NodeHandleContentType
		| "vectorStore"
		| "appEntry";
	switch (contentType) {
		case "appEntry":
		case "end":
			return "trigger";
		case "textGeneration":
		case "contentGeneration":
		case "imageGeneration":
		case "github":
		case "text":
		case "file":
		case "webPage":
		case "webSearch":
		case "audioGeneration":
		case "videoGeneration":
		case "trigger":
		case "action":
		case "query":
			return contentType;
		case "vectorStore": {
			if (!isVectorStoreNode(node)) {
				return "text";
			}
			const provider = node.content.source.provider as
				| typeof node.content.source.provider
				| "githubPullRequest";
			if (provider === "github") {
				return "vectorStoreGithub";
			}
			if (provider === "githubPullRequest") {
				return "vectorStoreGithubPullRequest";
			}
			return "text";
		}
		default:
			return "text";
	}
}

function getAppEntryPortLabel(label: string): string {
	const match = /^Input\((.+)\)$/.exec(label);
	if (!match) return label;
	return match[1] ?? label;
}

// Helper function to get completion label from node LLM provider
function getCompletionLabel(node: NodeLike): string {
	if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
		return node.content.llm.provider;
	}
	return "Completed";
}

// Helper function to check if a node requires setup
function nodeRequiresSetup(node: NodeLike): boolean {
	if (isAppEntryNode(node)) {
		return node.content.status !== "configured";
	}
	if (isTriggerNode(node, "github")) {
		return node.content.state.status !== "configured";
	}
	if (isActionNode(node, "github")) {
		return node.content.command.state.status !== "configured";
	}
	if (isVectorStoreNode(node)) {
		switch (node.content.source.provider) {
			case "github":
			case "document":
				return node.content.source.state.status !== "configured";
			default:
				return false;
		}
	}
	return false;
}

export const nodeTypes: NodeTypes = {
	giselle: CustomXyFlowNode,
};

function CustomXyFlowNode({ id, selected }: NodeProps) {
	const { node, connections, highlighted } = useAppDesignerStore(
		useShallow((s) => ({
			node: s.nodes.find((node) => node.id === id),
			connections: s.connections ?? [],
			highlighted: s.ui.nodeState[id as NodeId]?.highlighted,
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
	connectedInputIds = [],
	connectedOutputIds = [],
	preview = false,
}: {
	node: NodeLike;
	selected?: boolean;
	preview?: boolean;
	highlighted?: boolean;
	connectedInputIds?: InputId[];
	connectedOutputIds?: OutputId[];
}) {
	const updateNodeData = useAppDesignerStore((state) => state.updateNode);
	const { currentGeneration, stopCurrentGeneration, showCompleteLabel } =
		useNodeGenerationStatus(node.id as NodeId);
	const metadataTexts = useMemo(() => {
		const tmp: { label: string; tooltip: string }[] = [];
		if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
			tmp.push({ label: node.content.llm.provider, tooltip: "LLM Provider" });
		}
		tmp.push({ label: node.id.substring(3, 11), tooltip: "Node ID" });
		return tmp;
	}, [node]);

	/**
	 * Abbreviating variant as v.
	 */
	const v = useMemo(() => {
		const isText = node.content.type === "text";
		const isFile = node.content.type === "file";
		const isWebPage = node.content.type === "webPage";
		const isTextGeneration = node.content.type === "textGeneration";
		const isContentGeneration = node.content.type === "contentGeneration";
		const isImageGeneration = node.content.type === "imageGeneration";
		const isGithub = node.content.type === "github";
		const isVectorStore = node.content.type === "vectorStore";
		const isTrigger = node.content.type === "trigger";
		const isAction = node.content.type === "action";
		const isQuery = node.content.type === "query";
		const isAppEntry = node.content.type === "appEntry";
		const isEnd = node.content.type === "end";

		const isVectorStoreGithub =
			isVectorStore &&
			isVectorStoreNode(node) &&
			node.content.source.provider === "github";
		const isVectorStoreDocument =
			isVectorStore &&
			isVectorStoreNode(node) &&
			node.content.source.provider === "document";
		const isGithubTrigger = isTriggerNode(node, "github");

		const isFillIcon =
			isText ||
			isFile ||
			isWebPage ||
			isGithub ||
			isVectorStore ||
			isAction ||
			isEnd;
		const isStrokeIcon =
			isTextGeneration || isImageGeneration || isTrigger || isQuery;

		const isDarkIconText = isText || isFile || isWebPage || isQuery;
		const isLightIconText =
			isTextGeneration ||
			isImageGeneration ||
			isGithub ||
			isVectorStoreGithub ||
			isTrigger ||
			isAction ||
			isEnd;

		return {
			isText,
			isFile,
			isWebPage,
			isTextGeneration,
			isContentGeneration,
			isImageGeneration,
			isGithub,
			isVectorStore,
			isTrigger,
			isAction,
			isQuery,
			isAppEntry,
			isEnd,
			isVectorStoreGithub,
			isVectorStoreDocument,
			isGithubTrigger,
			isFillIcon,
			isStrokeIcon,
			isDarkIconText,
			isLightIconText,
		};
	}, [node]);

	const requiresSetup = nodeRequiresSetup(node);
	const inputHandleContentType = getInputHandleContentType(node);

	type VariantType = {
		isText: boolean;
		isFile: boolean;
		isWebPage: boolean;
		isTextGeneration: boolean;
		isContentGeneration: boolean;
		isImageGeneration: boolean;
		isGithub: boolean;
		isVectorStore: boolean;
		isTrigger: boolean;
		isAction: boolean;
		isQuery: boolean;
		isAppEntry: boolean;
		isEnd: boolean;
		isVectorStoreGithub: boolean;
		isVectorStoreDocument: boolean;
		isGithubTrigger: boolean;
		isFillIcon: boolean;
		isStrokeIcon: boolean;
		isDarkIconText: boolean;
		isLightIconText: boolean;
	};
	const getNodeColorVariable = useCallback(
		(variant: VariantType): string | undefined => {
			if (variant.isText) return "var(--color-text-node-1)";
			if (variant.isFile) return "var(--color-file-node-1)";
			if (variant.isWebPage) return "var(--color-webPage-node-1)";
			if (variant.isTextGeneration) return "var(--color-generation-node-1)";
			if (variant.isContentGeneration) return "var(--color-generation-node-1)";
			if (variant.isImageGeneration)
				return "var(--color-image-generation-node-1)";
			if (
				variant.isGithub ||
				variant.isVectorStoreGithub ||
				variant.isVectorStoreDocument
			)
				return "var(--color-github-node-1)";
			if (variant.isTrigger) return "var(--color-trigger-node-1)";
			if (variant.isAppEntry || variant.isEnd) return STAGE_NODE_COLOR_VAR;
			if (variant.isAction) return "var(--color-action-node-1)";
			if (variant.isQuery) return "var(--color-query-node-1)";
			return undefined;
		},
		[],
	);

	// App Entry: shape change only.
	// - always pill (even in preview/selected)
	const isAppEntryPill = v.isAppEntry;
	const isEndPill = v.isEnd;
	const isStagePill = isAppEntryPill || isEndPill;
	const nodeRadiusClass = isStagePill ? "rounded-full" : "rounded-[16px]";
	const stagePillLayoutClass =
		"flex items-center gap-[8px] px-[14px] py-[8px] rounded-full";
	const nodeLayoutClass = isStagePill
		? stagePillLayoutClass
		: "flex flex-col py-[16px] gap-[16px] min-w-[180px]";
	const stageShapeClass =
		v.isAppEntry || v.isEnd
			? "backdrop-blur-[4px]"
			: "transition-all backdrop-blur-[4px]";
	// For unconfigured (dashed) state, keep the container background transparent
	// and rely on the dashed border layer's gradient fill to match other nodes.
	const stageBackgroundClass =
		(v.isAppEntry || v.isEnd) && !requiresSetup
			? STAGE_NODE_BG_CLASS
			: undefined;

	const borderGradientStyle = useMemo(() => {
		if (requiresSetup) return undefined;
		// For App Entry / End nodes, we use a fixed (white) gradient border defined in classes.
		if (v.isAppEntry || v.isEnd) return undefined;
		const colorVar = getNodeColorVariable(v);
		if (!colorVar) return undefined;

		return {
			backgroundImage: `linear-gradient(to bottom right, color-mix(in srgb, ${colorVar} 30%, transparent 70%), color-mix(in srgb, ${colorVar} 50%, transparent 50%) 50%, ${colorVar})`,
		};
	}, [v, requiresSetup, getNodeColorVariable]);

	const backgroundGradientStyle = useMemo(() => {
		if (requiresSetup) return undefined;
		// For App Entry / End nodes, we use a solid container background instead of a subtle gradient.
		if (v.isAppEntry || v.isEnd) return undefined;
		const colorVar = getNodeColorVariable(v);
		if (!colorVar) return undefined;

		return {
			backgroundImage: `radial-gradient(ellipse farthest-corner at center, color-mix(in srgb, ${colorVar} 15%, transparent 85%) 0%, color-mix(in srgb, ${colorVar} 6%, transparent 94%) 50%, color-mix(in srgb, ${colorVar} 3%, transparent 97%) 75%, transparent 100%)`,
		};
	}, [v, requiresSetup, getNodeColorVariable]);

	const appEntryPrimaryOutputId = node.outputs?.[0]?.id;
	const isAppEntryAnyOutputConnected = connectedOutputIds.length > 0;
	const endPrimaryInputId = node.inputs?.[0]?.id ?? "blank-handle";
	const isEndAnyInputConnected =
		(connectedInputIds?.length ?? 0) > 0 ||
		connectedInputIds?.some((id) => id === endPrimaryInputId);

	function renderAppEntryPillHandles() {
		if (!appEntryPrimaryOutputId) return null;
		return (
			<>
				<Handle
					id={appEntryPrimaryOutputId}
					type="source"
					position={Position.Right}
					className={clsx(
						"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !right-[-0.5px] !top-1/2",
						isAppEntryAnyOutputConnected
							? STAGE_NODE_HANDLE_BG_CLASS
							: "!bg-bg",
						STAGE_NODE_BORDER_CLASS,
						isAppEntryAnyOutputConnected &&
							"[box-shadow:0_0_0_1.5px_rgba(0,0,0,0.8)]",
					)}
				/>
				{node.outputs
					?.filter((output) => output.id !== appEntryPrimaryOutputId)
					.map((output) => (
						<Handle
							key={output.id}
							id={output.id}
							type="source"
							position={Position.Right}
							className={clsx(
								"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !right-[-0.5px] !top-1/2 !opacity-0 !pointer-events-none",
							)}
						/>
					))}
			</>
		);
	}

	function renderEndPillHandles() {
		return (
			<>
				<Handle
					id={endPrimaryInputId}
					type="target"
					position={Position.Left}
					className={clsx(
						"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !left-[-0.5px] !top-1/2",
						isEndAnyInputConnected ? STAGE_NODE_HANDLE_BG_CLASS : "!bg-bg",
						STAGE_NODE_BORDER_CLASS,
						isEndAnyInputConnected &&
							"[box-shadow:0_0_0_1.5px_rgba(0,0,0,0.8)]",
					)}
				/>
				{node.inputs
					?.filter((input) => input.id !== endPrimaryInputId)
					.map((input) => (
						<Handle
							key={input.id}
							id={input.id}
							type="target"
							position={Position.Left}
							className={clsx(
								"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !left-[-0.5px] !top-1/2 !opacity-0 !pointer-events-none",
							)}
						/>
					))}
			</>
		);
	}

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
				"group relative rounded-[16px]",
				nodeLayoutClass,
				// Stage Request / Stage Response are rendered as pill nodes, so avoid animating layout/border-radius.
				stageShapeClass,
				stageBackgroundClass,
				!v.isAppEntry && !v.isEnd && "bg-transparent",
				!selected &&
					!highlighted &&
					"shadow-[4px_4px_8px_4px_rgba(0,_0,_0,_0.5)]",
				selected && v.isText && "shadow-text-node-1",
				selected && v.isFile && "shadow-file-node-1",
				selected && v.isWebPage && "shadow-webPage-node-1",
				selected && v.isTextGeneration && "shadow-generation-node-1",
				selected && v.isContentGeneration && "shadow-generation-node-1",
				selected && v.isImageGeneration && "shadow-image-generation-node-1",
				selected && v.isGithub && "shadow-github-node-1",
				selected && v.isVectorStoreGithub && "shadow-github-node-1",
				selected && v.isVectorStoreDocument && "shadow-github-node-1",
				selected && v.isTrigger && "shadow-trigger-node-1",
				selected && v.isAppEntry && "shadow-stage-node-1",
				selected && v.isAction && "shadow-action-node-1",
				selected && v.isEnd && "shadow-stage-node-1",
				selected && v.isQuery && "shadow-query-node-1",
				selected && "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)]",
				selected &&
					(v.isTrigger || v.isAppEntry) &&
					"shadow-[0px_0px_20px_1px_hsla(220,_15%,_50%,_0.4)]",
				highlighted && v.isText && "shadow-text-node-1",
				highlighted && v.isFile && "shadow-file-node-1",
				highlighted && v.isWebPage && "shadow-webPage-node-1",
				highlighted && v.isTextGeneration && "shadow-generation-node-1",
				highlighted && v.isContentGeneration && "shadow-generation-node-1",
				highlighted && v.isImageGeneration && "shadow-image-generation-node-1",
				highlighted && v.isGithub && "shadow-github-node-1",
				highlighted && v.isVectorStoreGithub && "shadow-github-node-1",
				highlighted && v.isVectorStoreDocument && "shadow-github-node-1",
				highlighted && v.isTrigger && "shadow-trigger-node-1",
				highlighted && v.isAppEntry && "shadow-stage-node-1",
				highlighted && v.isAction && "shadow-action-node-1",
				highlighted && v.isEnd && "shadow-stage-node-1",
				highlighted && v.isQuery && "shadow-query-node-1",
				highlighted && "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)]",
				highlighted &&
					(v.isTrigger || v.isAppEntry) &&
					"shadow-[0px_0px_20px_1px_hsla(220,_15%,_50%,_0.4)]",
				preview && "opacity-50",
				!preview && !isStagePill && "min-h-[110px]",
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
							<p className="text-[10px] font-medium font-geist text-text-muted leading-[140%]">
								{getCompletionLabel(node)}
							</p>
							<CheckIcon className="w-4 h-4" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			{(v.isAppEntry || v.isEnd) && selected && (
				<div
					className={clsx(
						"absolute inset-0 z-[-2] pointer-events-none",
						nodeRadiusClass,
						"shadow-[0_0_22px_4px_color-mix(in_srgb,var(--color-stage-node-1,var(--color-blue-muted))_70%,transparent)]",
					)}
				/>
			)}
			<div
				className={clsx(
					"absolute z-[-1] inset-0",
					nodeRadiusClass,
					(v.isAppEntry || v.isEnd) && "hidden",
				)}
				style={backgroundGradientStyle}
			/>
			<div
				className={clsx(
					"absolute z-0 inset-0 border-[1.5px] mask-fill",
					nodeRadiusClass,
					requiresSetup
						? "border-black/60 border-dashed [border-width:2px]"
						: "border-transparent",
					!borderGradientStyle && "bg-gradient-to-br",
					!borderGradientStyle &&
						(v.isAppEntry || v.isEnd) &&
						(requiresSetup
							? "from-[color-mix(in_srgb,var(--color-stage-node-1,var(--color-blue-muted))_30%,transparent)] via-[color-mix(in_srgb,var(--color-stage-node-1,var(--color-blue-muted))_50%,transparent)] to-[color:var(--color-stage-node-1,var(--color-blue-muted))]"
							: "from-inverse/80 via-inverse/30 to-inverse/60"),
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isText &&
						"from-text-node-1/30 via-text-node-1/50 to-text-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isFile &&
						"from-file-node-1/30 via-file-node-1/50 to-file-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isWebPage &&
						"from-webPage-node-1/30 via-webPage-node-1/50 to-webPage-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isTextGeneration &&
						"from-generation-node-1/30 via-generation-node-1/50 to-generation-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isContentGeneration &&
						"from-generation-node-1/30 via-generation-node-1/50 to-generation-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isImageGeneration &&
						"from-image-generation-node-1/30 via-image-generation-node-1/50 to-image-generation-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isGithub &&
						"from-github-node-1/30 via-github-node-1/50 to-github-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isVectorStoreGithub &&
						"from-github-node-1/30 via-github-node-1/50 to-github-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isVectorStoreDocument &&
						"from-github-node-1/30 via-github-node-1/50 to-github-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isTrigger &&
						"from-trigger-node-1/30 via-trigger-node-1/50 to-trigger-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isAction &&
						"from-action-node-1/30 via-action-node-1/50 to-action-node-1",
					!borderGradientStyle &&
						!v.isAppEntry &&
						!v.isEnd &&
						v.isQuery &&
						"from-query-node-1/30 via-query-node-1/50 to-query-node-1",
				)}
				style={borderGradientStyle}
			/>
			{isTriggerNode(node, "github") &&
				node.content.state.status === "configured" && (
					<div className="absolute top-[-20px] left-0 z-10">
						<GitHubTriggerStatusBadge
							triggerId={node.content.state.flowTriggerId}
						/>
					</div>
				)}
			{isStagePill ? (
				<>
					{isAppEntryPill ? renderAppEntryPillHandles() : null}
					{isEndPill ? renderEndPillHandles() : null}
					<div
						className={clsx(
							"w-[28px] h-[28px] flex items-center justify-center rounded-full bg-inverse shrink-0",
						)}
					>
						<NodeIcon
							node={node}
							className={clsx(
								"w-[14px] h-[14px] stroke-current fill-none text-gray-900",
							)}
						/>
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-[14px] font-medium text-inverse leading-none truncate">
							{defaultName(node)}
						</p>
					</div>
				</>
			) : (
				<div className={clsx("px-[16px] relative")}>
					<div className="flex items-center gap-[8px]">
						<div
							className={clsx(
								"w-[32px] h-[32px] flex items-center justify-center padding-[8px]",
								v.isAppEntry || v.isEnd ? "rounded-full" : "rounded-[8px]",
								v.isText && "bg-text-node-1",
								v.isFile && "bg-file-node-1",
								v.isWebPage && "bg-webPage-node-1",
								v.isTextGeneration && "bg-generation-node-1",
								v.isContentGeneration && "bg-generation-node-1",
								v.isImageGeneration && "bg-image-generation-node-1",
								v.isGithub && "bg-github-node-1",
								v.isVectorStoreGithub && "bg-github-node-1",
								v.isVectorStoreDocument && "bg-github-node-1",
								v.isTrigger && "bg-trigger-node-1",
								v.isAppEntry && "bg-inverse",
								v.isAction && "bg-action-node-1",
								v.isEnd && "bg-inverse",
								v.isQuery && "bg-query-node-1",
							)}
						>
							<NodeIcon
								node={node}
								className={clsx(
									"w-[16px] h-[16px]",
									v.isText && "fill-current",
									v.isFile && "fill-current",
									v.isWebPage && "fill-current",
									v.isTextGeneration && "fill-current",
									v.isContentGeneration && "fill-current",
									v.isImageGeneration && "fill-current",
									v.isVectorStore &&
										!v.isVectorStoreGithub &&
										"stroke-current fill-none",
									v.isVectorStoreGithub && "fill-current",
									v.isVectorStoreDocument && "stroke-current fill-none",
									v.isTrigger &&
										!v.isGithubTrigger &&
										"stroke-current fill-none",
									v.isGithubTrigger && "fill-current",
									v.isAppEntry && "stroke-current fill-none",
									v.isAction && "fill-current",
									v.isEnd && "stroke-current fill-none",
									v.isQuery && "stroke-current fill-none",
									v.isGithub && "fill-current",
									v.isText && "text-background",
									v.isFile && "text-background",
									v.isWebPage && "text-background",
									v.isTextGeneration && "text-inverse",
									v.isImageGeneration && "text-inverse",
									v.isGithub && "text-background",
									v.isVectorStoreGithub && "text-background",
									v.isVectorStoreDocument && "text-background",
									v.isTrigger && !v.isGithubTrigger && "text-inverse",
									v.isGithubTrigger && "text-background",
									v.isAppEntry && "text-gray-900",
									v.isAction && "text-inverse",
									v.isEnd && "text-gray-900",
									v.isQuery && "text-background",
								)}
							/>
						</div>
						<div>
							<div className="flex items-center gap-[2px] pl-[4px] text-[10px] font-mono [&>*:not(:last-child)]:after:content-['/'] [&>*:not(:last-child)]:after:ml-[2px] [&>*:not(:last-child)]:after:text-text/60">
								{metadataTexts.map((item, _index) => (
									<div key={item.label} className="text-[10px] text-inverse">
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
			)}
			{!isStagePill && <DocumentNodeInfo node={node} />}
			{!isStagePill && <GitHubNodeInfo node={node} />}
			{!isStagePill && !preview && (
				<div className="flex justify-between">
					<div className="grid">
						{node.content.type !== "action" &&
							node.inputs?.map((input) => {
								const isInConnected =
									connectedInputIds?.some(
										(connectedInputId) => connectedInputId === input.id,
									) ?? false;
								return (
									<div
										className="relative flex items-center h-[28px]"
										key={input.id}
									>
										<NodeHandleDot
											position={Position.Left}
											isConnected={isInConnected}
											isConnectable={false}
											contentType={inputHandleContentType}
											id={input.id}
										/>
										<NodeInputLabel
											label={input.label}
											isConnected={isInConnected}
											isRequired={Boolean(
												(input as { isRequired?: boolean }).isRequired,
											)}
										/>
									</div>
								);
							})}
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
									<NodeHandleDot
										position={Position.Left}
										isConnected={
											connectedInputIds?.some(
												(connectedInputId) => connectedInputId === input.id,
											) ?? false
										}
										isConnectable={
											!connectedInputIds?.some(
												(connectedInputId) => connectedInputId === input.id,
											)
										}
										contentType="action"
										id={input.id}
									/>
									<NodeInputLabel
										label={input.label}
										isConnected={
											connectedInputIds?.some(
												(connectedInputId) => connectedInputId === input.id,
											) ?? false
										}
										isRequired={input.isRequired}
									/>
								</div>
							))}
						{node.type === "operation" &&
							node.content.type !== "trigger" &&
							node.content.type !== "appEntry" &&
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
											"!absolute !w-[11px] !h-[11px] !rounded-full !-left-[4.5px] !translate-x-[50%] !border-[1.5px] !bg-bg",
											v.isTextGeneration && "!border-generation-node-1",
											v.isContentGeneration && "!border-generation-node-1",
											v.isImageGeneration && "!border-image-generation-node-1",
											v.isQuery && "!border-query-node-1",
											v.isEnd && "!border-trigger-node-1",
										)}
									/>
									<div className="absolute left-[-12px] text-[12px] text-text-muted whitespace-nowrap -translate-x-[100%]">
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
										"group-data-[state=disconnected]:!bg-bg",
										v.isTextGeneration &&
											"!border-generation-node-1 group-data-[state=connected]:!bg-generation-node-1",
										v.isContentGeneration &&
											"!border-generation-node-1 group-data-[state=connected]:!bg-generation-node-1",
										v.isImageGeneration &&
											"!border-image-generation-node-1 group-data-[state=connected]:!bg-image-generation-node-1",
										v.isGithub &&
											"!border-github-node-1 group-data-[state=connected]:!bg-github-node-1",
										v.isVectorStoreGithub &&
											"!border-github-node-1 group-data-[state=connected]:!bg-github-node-1",
										v.isVectorStoreDocument &&
											"!border-github-node-1 group-data-[state=connected]:!bg-github-node-1",
										v.isText &&
											"!border-text-node-1 group-data-[state=connected]:!bg-text-node-1 group-data-[state=connected]:!border-text-node-1",
										v.isFile &&
											"!border-file-node-1 group-data-[state=connected]:!bg-file-node-1 group-data-[state=connected]:!border-file-node-1",
										v.isWebPage &&
											"!border-webPage-node-1 group-data-[state=connected]:!bg-webPage-node-1 group-data-[state=connected]:!border-webPage-node-1",
										v.isTrigger &&
											"!border-trigger-node-1 group-data-[state=connected]:!bg-trigger-node-1 group-data-[state=connected]:!border-trigger-node-1",
										v.isAppEntry &&
											"!border-trigger-node-1 group-data-[state=connected]:!bg-trigger-node-1 group-data-[state=connected]:!border-trigger-node-1",
										v.isAction &&
											"!border-action-node-1 group-data-[state=connected]:!bg-action-node-1 group-data-[state=connected]:!border-action-node-1",
										v.isQuery &&
											"!border-query-node-1 group-data-[state=connected]:!bg-query-node-1 group-data-[state=connected]:!border-query-node-1",
										v.isEnd &&
											"!border-trigger-node-1 group-data-[state=connected]:!bg-trigger-node-1 group-data-[state=connected]:!border-trigger-node-1",
									)}
								/>
								<div
									className={clsx(
										"text-[12px]",
										"group-data-[state=connected]:px-[16px]",
										"group-data-[state=disconnected]:absolute group-data-[state=disconnected]:-right-[12px] group-data-[state=disconnected]:whitespace-nowrap group-data-[state=disconnected]:translate-x-[100%]",
										"group-data-[state=connected]:text-inverse group-data-[state=disconnected]:text-text-muted",
									)}
								>
									{v.isAppEntry
										? getAppEntryPortLabel(output.label)
										: output.label}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
