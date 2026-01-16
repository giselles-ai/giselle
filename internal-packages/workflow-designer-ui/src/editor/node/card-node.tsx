import { defaultName } from "@giselles-ai/node-registry";
import type {
	InputId,
	NodeId,
	NodeLike,
	OutputId,
} from "@giselles-ai/protocol";
import {
	isImageGenerationNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
} from "@giselles-ai/protocol";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import clsx from "clsx/lite";
import { useCallback, useMemo } from "react";
import { useAppDesignerStore, useUpdateNodeData } from "../../app-designer";
import { NodeIcon } from "../../icons/node";
import { EditableText } from "../../ui/editable-text";
import { Tooltip } from "../../ui/tooltip";
import { NodeGenerationStatusBadge } from "./node-generation-status-badge";
import { nodeRequiresSetup, useNodeGenerationStatus } from "./node-utils";
import { DocumentNodeInfo, GitHubNodeInfo } from "./ui";
import { GitHubTriggerStatusBadge } from "./ui/github-trigger/status-badge";

export function CardXyFlowNode({ id, selected }: NodeProps) {
	const { node, connections, highlighted } = useAppDesignerStore((s) => ({
		node: s.nodes.find((node) => node.id === id),
		connections: s.connections ?? [],
		highlighted: s.ui.nodeState[id as NodeId]?.highlighted,
	}));

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

	if (!node) {
		return null;
	}

	return (
		<NodeComponent
			node={node as NodeLike}
			selected={selected}
			highlighted={highlighted}
			connectedInputIds={connectedInputIds as InputId[]}
			connectedOutputIds={connectedOutputIds as OutputId[]}
		/>
	);
}

/**
 * Abbreviating variant as v.
 */
function useVariant(node: NodeLike) {
	return useMemo(() => {
		const isText = node.content.type === "text";
		const isFile = node.content.type === "file";
		const isWebPage = node.content.type === "webPage";
		const isTextGeneration = node.content.type === "textGeneration";
		const isContentGeneration = node.content.type === "contentGeneration";
		const isImageGeneration = node.content.type === "imageGeneration";
		const isGithub = node.content.type === "github";
		const isVectorStore = node.content.type === "vectorStore";
		const isDataStore = node.content.type === "dataStore";
		const isTrigger = node.content.type === "trigger";
		const isAction = node.content.type === "action";
		const isQuery = node.content.type === "query";

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
			isDataStore ||
			isAction;
		const isStrokeIcon =
			isTextGeneration || isImageGeneration || isTrigger || isQuery;

		const isDarkIconText =
			isText || isFile || isWebPage || isQuery || isDataStore;
		const isLightIconText =
			isTextGeneration ||
			isImageGeneration ||
			isGithub ||
			isVectorStoreGithub ||
			isTrigger ||
			isAction;

		return {
			isText,
			isFile,
			isWebPage,
			isTextGeneration,
			isContentGeneration,
			isImageGeneration,
			isGithub,
			isVectorStore,
			isDataStore,
			isTrigger,
			isAction,
			isQuery,
			isVectorStoreGithub,
			isVectorStoreDocument,
			isGithubTrigger,
			isFillIcon,
			isStrokeIcon,
			isDarkIconText,
			isLightIconText,
		};
	}, [node]);
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
	const updateNodeData = useUpdateNodeData();
	const { currentGeneration, stopCurrentGeneration, showCompleteLabel } =
		useNodeGenerationStatus(node.id);
	const metadataTexts = useMemo(() => {
		const tmp: { label: string; tooltip: string }[] = [];
		if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
			tmp.push({ label: node.content.llm.provider, tooltip: "LLM Provider" });
		}
		tmp.push({ label: node.id.substring(3, 11), tooltip: "Node ID" });
		return tmp;
	}, [node]);

	const v = useVariant(node);

	const requiresSetup = nodeRequiresSetup(node);

	type VariantType = {
		isText: boolean;
		isFile: boolean;
		isWebPage: boolean;
		isTextGeneration: boolean;
		isContentGeneration: boolean;
		isImageGeneration: boolean;
		isGithub: boolean;
		isVectorStore: boolean;
		isDataStore: boolean;
		isTrigger: boolean;
		isAction: boolean;
		isQuery: boolean;
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
			if (variant.isDataStore) return "var(--color-data-store-node-1)";
			if (variant.isTrigger) return "var(--color-trigger-node-1)";
			if (variant.isAction) return "var(--color-action-node-1)";
			if (variant.isQuery) return "var(--color-query-node-1)";
			return undefined;
		},
		[],
	);

	const nodeRadiusClass = "rounded-[16px]";
	const nodeLayoutClass = "flex flex-col py-[16px] gap-[16px] min-w-[180px]";
	const stageShapeClass = "transition-all backdrop-blur-[4px]";
	const stageBackgroundClass = undefined;

	const borderGradientStyle = useMemo(() => {
		if (requiresSetup) return undefined;
		const colorVar = getNodeColorVariable(v);
		if (!colorVar) return undefined;

		return {
			backgroundImage: `linear-gradient(to bottom right, color-mix(in srgb, ${colorVar} 30%, transparent 70%), color-mix(in srgb, ${colorVar} 50%, transparent 50%) 50%, ${colorVar})`,
		};
	}, [v, requiresSetup, getNodeColorVariable]);

	const backgroundGradientStyle = useMemo(() => {
		if (requiresSetup) return undefined;
		const colorVar = getNodeColorVariable(v);
		if (!colorVar) return undefined;

		return {
			backgroundImage: `radial-gradient(ellipse farthest-corner at center, color-mix(in srgb, ${colorVar} 15%, transparent 85%) 0%, color-mix(in srgb, ${colorVar} 6%, transparent 94%) 50%, color-mix(in srgb, ${colorVar} 3%, transparent 97%) 75%, transparent 100%)`,
		};
	}, [v, requiresSetup, getNodeColorVariable]);

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
				"bg-transparent",
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
				selected && v.isAction && "shadow-action-node-1",
				selected && v.isQuery && "shadow-query-node-1",
				selected && v.isDataStore && "shadow-data-store-node-1",
				selected && "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)]",
				selected &&
					v.isTrigger &&
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
				highlighted && v.isAction && "shadow-action-node-1",
				highlighted && v.isQuery && "shadow-query-node-1",
				highlighted && v.isDataStore && "shadow-data-store-node-1",
				highlighted && "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)]",
				highlighted &&
					v.isTrigger &&
					"shadow-[0px_0px_20px_1px_hsla(220,_15%,_50%,_0.4)]",
				preview && "opacity-50",
				!preview && "min-h-[110px]",
				requiresSetup && "opacity-80",
			)}
		>
			<NodeGenerationStatusBadge
				node={node}
				currentGeneration={currentGeneration}
				showCompleteLabel={showCompleteLabel}
				onStopCurrentGeneration={stopCurrentGeneration}
			/>
			<div
				className={clsx("absolute z-[-1] inset-0", nodeRadiusClass)}
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
						v.isText &&
						"from-text-node-1/30 via-text-node-1/50 to-text-node-1",
					!borderGradientStyle &&
						v.isFile &&
						"from-file-node-1/30 via-file-node-1/50 to-file-node-1",
					!borderGradientStyle &&
						v.isWebPage &&
						"from-webPage-node-1/30 via-webPage-node-1/50 to-webPage-node-1",
					!borderGradientStyle &&
						v.isTextGeneration &&
						"from-generation-node-1/30 via-generation-node-1/50 to-generation-node-1",
					!borderGradientStyle &&
						v.isContentGeneration &&
						"from-generation-node-1/30 via-generation-node-1/50 to-generation-node-1",
					!borderGradientStyle &&
						v.isImageGeneration &&
						"from-image-generation-node-1/30 via-image-generation-node-1/50 to-image-generation-node-1",
					!borderGradientStyle &&
						v.isGithub &&
						"from-github-node-1/30 via-github-node-1/50 to-github-node-1",
					!borderGradientStyle &&
						v.isVectorStoreGithub &&
						"from-github-node-1/30 via-github-node-1/50 to-github-node-1",
					!borderGradientStyle &&
						v.isVectorStoreDocument &&
						"from-github-node-1/30 via-github-node-1/50 to-github-node-1",
					!borderGradientStyle &&
						v.isTrigger &&
						"from-trigger-node-1/30 via-trigger-node-1/50 to-trigger-node-1",
					!borderGradientStyle &&
						v.isAction &&
						"from-action-node-1/30 via-action-node-1/50 to-action-node-1",
					!borderGradientStyle &&
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
			<div className={clsx("px-[16px] relative")}>
				<div className="flex items-center gap-[8px]">
					<div
						className={clsx(
							"w-[32px] h-[32px] flex items-center justify-center padding-[8px]",
							"rounded-[8px]",
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
							v.isAction && "bg-action-node-1",
							v.isQuery && "bg-query-node-1",
							v.isDataStore && "bg-data-store-node-1",
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
								v.isTrigger && !v.isGithubTrigger && "stroke-current fill-none",
								v.isGithubTrigger && "fill-current",
								v.isAction && "fill-current",
								v.isQuery && "stroke-current fill-none",
								v.isDataStore && "fill-current",
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
								v.isAction && "text-inverse",
								v.isQuery && "text-background",
								v.isDataStore && "text-background",
							)}
						/>
					</div>
					<div>
						<div className="flex items-center gap-[2px] pl-[4px] text-[10px] font-mono [&>*:not(:last-child)]:after:content-['/'] [&>*:not(:last-child)]:after:ml-[2px] [&>*:not(:last-child)]:after:text-text/60">
							{metadataTexts.map((item) => (
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
					</div>
				</div>
			</div>
			<DocumentNodeInfo node={node} />
			<GitHubNodeInfo node={node} />
			{!preview && (
				<InputOutput
					node={node}
					connectedInputIds={connectedInputIds}
					connectedOutputIds={connectedOutputIds}
				/>
			)}
		</div>
	);
}

function InputOutput({
	node,
	connectedInputIds = [],
	connectedOutputIds = [],
}: {
	node: NodeLike;
	connectedInputIds?: InputId[];
	connectedOutputIds?: OutputId[];
}) {
	const v = useVariant(node);
	const isInputConnected = connectedInputIds?.length > 0;
	const isOutputConnected = connectedOutputIds?.length > 0;
	return (
		<div className="flex justify-between">
			<div className="grid">
				{node.type === "operation" &&
					node.content.type !== "trigger" &&
					node.content.type !== "appEntry" && (
						<div
							className="group relative flex items-center h-[28px]"
							data-state={isInputConnected ? "connected" : "disconnected"}
						>
							<Handle
								type="target"
								position={Position.Left}
								className={clsx(
									"!absolute !w-[11px] !h-[11px] !rounded-full !-left-[4.5px] !translate-x-[50%] !border-[1.5px] !bg-background",
									v.isTextGeneration &&
										"!border-generation-node-1 group-data-[state=connected]:!bg-generation-node-1",
									v.isContentGeneration &&
										"!border-generation-node-1 group-data-[state=connected]:!bg-generation-node-1",
									v.isImageGeneration &&
										"!border-image-generation-node-1 group-data-[state=connected]:!bg-image-generation-node-1",
									v.isAction &&
										"!border-action-node-1 group-data-[state=connected]:!bg-action-node-1",
									v.isQuery &&
										"!border-query-node-1 group-data-[state=connected]:!bg-query-node-1",
								)}
							/>
							<div
								className={clsx(
									"text-[12px]",
									isInputConnected
										? "px-[16px] text-inverse"
										: "absolute -left-[12px] whitespace-nowrap -translate-x-[100%] text-text-muted",
								)}
							>
								Input
							</div>
						</div>
					)}
			</div>

			<div className="grid">
				<div
					className="relative group flex items-center h-[28px]"
					data-state={isOutputConnected ? "connected" : "disconnected"}
				>
					<Handle
						type="source"
						position={Position.Right}
						className={clsx(
							"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !right-[-0.5px]",
							"group-data-[state=disconnected]:!bg-background",
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
							v.isAction &&
								"!border-action-node-1 group-data-[state=connected]:!bg-action-node-1 group-data-[state=connected]:!border-action-node-1",
							v.isQuery &&
								"!border-query-node-1 group-data-[state=connected]:!bg-query-node-1 group-data-[state=connected]:!border-query-node-1",
							v.isDataStore &&
								"!border-data-store-node-1 group-data-[state=connected]:!bg-data-store-node-1 group-data-[state=connected]:!border-data-store-node-1",
						)}
					/>
					<div
						className={clsx(
							"text-[12px]",
							isOutputConnected
								? "px-[16px] text-inverse"
								: "absolute -right-[12px] whitespace-nowrap translate-x-[100%] text-text-muted",
						)}
					>
						Output
					</div>
				</div>
			</div>
		</div>
	);
}
