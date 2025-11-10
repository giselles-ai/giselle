import { defaultName } from "@giselles-ai/node-registry";
import {
	isImageGenerationNode,
	isTextGenerationNode,
	NodeId,
	type NodeLike,
} from "@giselles-ai/protocol";
import { Handle, Position, type NodeProps as RFNodeProps } from "@xyflow/react";
import clsx from "clsx/lite";
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { NodeIcon } from "../../../icons/node";
import { EditableText } from "../../../ui/editable-text";
import { NodeHandleDot } from "../../../ui/node/node-handle-dot";
import { NodeInputLabel } from "../../../ui/node/node-input-label";
import { Tooltip } from "../../../ui/tooltip";
import { selectNodePanelDataById } from "../../lib/selectors";
import { useEditorStoreWithEqualityFn } from "../../store/context";

export function Node({ id, selected }: RFNodeProps) {
	const {
		node,
		connectedInputIds,
		connectedOutputIds,
		highlighted,
		updateNode,
	} = useEditorStoreWithEqualityFn(
		selectNodePanelDataById(NodeId.parse(id)),
		(a, b) => {
			return (
				a.node === b.node &&
				shallow(a.connectedInputIds, b.connectedInputIds) &&
				shallow(a.connectedOutputIds, b.connectedOutputIds) &&
				a.highlighted === b.highlighted &&
				a.updateNode === b.updateNode
			);
		},
	);

	const metadataTexts = useMemo(() => {
		if (!node) return [];
		const tmp: { label: string; tooltip: string }[] = [];
		if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
			tmp.push({
				label: node.content.llm.provider,
				tooltip: "LLM Provider",
			});
		}
		tmp.push({ label: node.id.substring(3, 11), tooltip: "Node ID" });
		return tmp;
	}, [node]);

	if (!node) {
		return null;
	}

	return (
		<CanvasNode
			node={node}
			name={defaultName(node)}
			contentType={node.content.type}
			selected={selected}
			highlighted={highlighted}
			connectedInputIds={connectedInputIds}
			connectedOutputIds={connectedOutputIds}
			metadataTexts={metadataTexts}
			// @ts-expect-error
			vectorStoreSourceProvider={node.content.source?.provider}
			onNameChange={(value) => {
				if (value === defaultName(node)) {
					return;
				}
				if (value.trim().length === 0) {
					updateNode(node.id, { name: undefined });
					return;
				}
				updateNode(node.id, { name: value });
			}}
			onClickToEditMode={(e) => {
				if (!selected) {
					e.preventDefault();
					return;
				}
				e.stopPropagation();
			}}
		/>
	);
}

interface CanvasNodeProps {
	node: NodeLike; // TODO: define concrete type
	name: string;
	contentType: string;
	selected?: boolean;
	highlighted?: boolean;
	preview?: boolean;
	requiresSetup?: boolean;
	vectorStoreSourceProvider?: string;
	connectedInputIds?: string[];
	connectedOutputIds?: string[];
	metadataTexts?: { label: string; tooltip: string }[];
	onNameChange: (value: string) => void;
	onClickToEditMode: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function CanvasNode({
	node,
	name,
	contentType,
	selected,
	highlighted,
	preview,
	requiresSetup,
	vectorStoreSourceProvider,
	connectedInputIds,
	connectedOutputIds,
	metadataTexts,
	onNameChange,
	onClickToEditMode,
}: CanvasNodeProps) {
	/**
	 * Abbreviating variant as v.
	 */
	const v = useMemo(() => {
		const isText = contentType === "text";
		const isFile = contentType === "file";
		const isWebPage = contentType === "webPage";
		const isTextGeneration = contentType === "textGeneration";
		const isImageGeneration = contentType === "imageGeneration";
		const isGithub = contentType === "github";
		const isVectorStore = contentType === "vectorStore";
		const isWebSearch = contentType === "webSearch";
		const isAudioGeneration = contentType === "audioGeneration";
		const isVideoGeneration = contentType === "videoGeneration";
		const isTrigger = contentType === "trigger";
		const isAction = contentType === "action";
		const isQuery = contentType === "query";

		const isVectorStoreGithub =
			isVectorStore && vectorStoreSourceProvider === "github";
		const isVectorStoreGithubPullRequest =
			isVectorStore && vectorStoreSourceProvider === "githubPullRequest";

		const isFillIcon =
			isText || isFile || isWebPage || isGithub || isVectorStore || isAction;
		const isStrokeIcon =
			isTextGeneration ||
			isImageGeneration ||
			isWebSearch ||
			isAudioGeneration ||
			isVideoGeneration ||
			isTrigger ||
			isQuery;

		const isDarkIconText = isText || isFile || isWebPage || isQuery;
		const isLightIconText =
			isTextGeneration ||
			isImageGeneration ||
			isGithub ||
			isVectorStoreGithub ||
			isVectorStoreGithubPullRequest ||
			isWebSearch ||
			isAudioGeneration ||
			isVideoGeneration ||
			isTrigger ||
			isAction;

		return {
			isText,
			isFile,
			isWebPage,
			isTextGeneration,
			isImageGeneration,
			isGithub,
			isVectorStore,
			isWebSearch,
			isAudioGeneration,
			isVideoGeneration,
			isTrigger,
			isAction,
			isQuery,
			isVectorStoreGithub,
			isVectorStoreGithubPullRequest,
			isFillIcon,
			isStrokeIcon,
			isDarkIconText,
			isLightIconText,
		};
	}, [contentType, vectorStoreSourceProvider]);

	const inputHandleContentType = useMemo<
		Parameters<typeof NodeHandleDot>[0]["contentType"]
	>(() => {
		switch (contentType) {
			case "textGeneration":
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
			case "vectorStore":
				if (vectorStoreSourceProvider === "github") {
					return "vectorStoreGithub";
				}
				if (vectorStoreSourceProvider === "githubPullRequest") {
					return "vectorStoreGithubPullRequest";
				}
				return "text";
			default:
				return "text";
		}
	}, [contentType, vectorStoreSourceProvider]);

	return (
		<div
			className={clsx(
				"group relative flex flex-col rounded-[16px] py-[16px] gap-[16px] min-w-[180px]",
				"bg-gradient-to-tl transition-all backdrop-blur-[4px]",
				v.isText && "from-text-node-1 to-text-node-2 shadow-text-node-1",
				v.isFile && "from-file-node-1 to-file-node-2 shadow-file-node-1",
				v.isWebPage &&
					"from-webPage-node-1 to-webPage-node-2 shadow-webPage-node-1",
				v.isTextGeneration && "to-generation-node-2 shadow-generation-node-1",
				v.isImageGeneration &&
					"from-image-generation-node-1 to-image-generation-node-2 shadow-image-generation-node-1",
				v.isGithub &&
					"from-github-node-1 to-github-node-2 shadow-github-node-1",
				v.isVectorStoreGithub &&
					"from-github-node-1 to-github-node-2 shadow-github-node-1",
				v.isVectorStoreGithubPullRequest &&
					"from-github-node-1 to-github-node-2 shadow-github-node-1",
				v.isWebSearch &&
					"from-web-search-node-1 to-web-search-node-2 shadow-web-search-node-1",
				v.isAudioGeneration &&
					"from-audio-generation-node-1 to-audio-generation-node-2 shadow-audio-generation-node-1",
				v.isVideoGeneration &&
					"from-video-generation-node-1 to-video-generation-node-2 shadow-video-generation-node-1",
				v.isTrigger &&
					"from-trigger-node-1/60 to-trigger-node-2 shadow-trigger-node-1",
				v.isAction &&
					"from-action-node-1 to-action-node-2 shadow-action-node-1",
				v.isQuery && "from-query-node-1 to-query-node-2 shadow-query-node-1",
				selected && "shadow-[0px_0px_16px_0px]",
				selected && v.isTrigger && "shadow-[0px_0px_16px_0px_hsl(220,15%,50%)]",
				highlighted && "shadow-[0px_0px_16px_0px]",
				highlighted &&
					v.isTrigger &&
					"shadow-[0px_0px_16px_0px_hsl(220,15%,50%)]",
				preview && "opacity-50",
				!preview && "min-h-[110px]",
				requiresSetup && "opacity-80",
			)}
		>
			<div
				className={clsx(
					"absolute z-0 rounded-[16px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder",
					requiresSetup
						? "border-black/60 border-dashed [border-width:2px]"
						: "border-transparent",
					v.isText && "from-text-node-1/25 to-text-node-1",
					v.isFile && "from-file-node-1/40 to-file-node-1",
					v.isWebPage && "from-webPage-node-1/40 to-webPage-node-1",
					v.isTextGeneration &&
						"from-generation-node-1/40 to-generation-node-1",
					v.isImageGeneration &&
						"from-image-generation-node-1/40 to-image-generation-node-1",
					v.isGithub && "from-github-node-1/40 to-github-node-1",
					v.isVectorStoreGithub && "from-github-node-1/40 to-github-node-1",
					v.isVectorStoreGithubPullRequest &&
						"from-github-node-1/40 to-github-node-1",
					v.isWebSearch && "from-web-search-node-1/40 to-web-search-node-1",
					v.isAudioGeneration &&
						"from-audio-generation-node-1/40 to-audio-generation-node-1",
					v.isVideoGeneration &&
						"from-video-generation-node-1/40 to-video-generation-node-1",
					v.isTrigger && "from-trigger-node-1/60 to-trigger-node-1",
					v.isAction && "from-action-node-1/40 to-action-node-1",
					v.isQuery && "from-query-node-1/40 to-query-node-1",
				)}
			/>

			<div className={clsx("px-[16px] relative")}>
				<div className="flex items-center gap-[8px]">
					<div
						className={clsx(
							"w-[32px] h-[32px] flex items-center justify-center rounded-[8px] padding-[8px]",
							v.isText && "bg-text-node-1",
							v.isFile && "bg-file-node-1",
							v.isWebPage && "bg-webPage-node-1",
							v.isTextGeneration && "bg-generation-node-1",
							v.isImageGeneration && "bg-image-generation-node-1",
							v.isGithub && "bg-github-node-1",
							v.isVectorStoreGithub && "bg-github-node-1",
							v.isVectorStoreGithubPullRequest && "bg-github-node-1",
							v.isWebSearch && "bg-web-search-node-1",
							v.isAudioGeneration && "bg-audio-generation-node-1",
							v.isVideoGeneration && "bg-video-generation-node-1",
							v.isTrigger && "bg-trigger-node-1",
							v.isAction && "bg-action-node-1",
							v.isQuery && "bg-query-node-1",
						)}
					>
						<NodeIcon
							node={node}
							className={clsx(
								"w-[16px] h-[16px]",
								v.isFillIcon && "fill-current",
								v.isStrokeIcon && "stroke-current fill-none",
								v.isDarkIconText && "text-background",
								v.isLightIconText && "text-inverse",
							)}
						/>
					</div>
					<div>
						<div className="flex items-center gap-[2px] pl-[4px] text-[10px] font-mono [&>*:not(:last-child)]:after:content-['/'] [&>*:not(:last-child)]:after:ml-[2px] [&>*:not(:last-child)]:after:text-inverse">
							{metadataTexts?.map((item) => (
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
							className={clsx(
								"**:data-input:w-full",
								!selected && "pointer-events-none",
							)}
							text={name}
							onValueChange={onNameChange}
							onClickToEditMode={onClickToEditMode}
						/>
					</div>
				</div>
			</div>
			{!preview && (
				<div className="flex justify-between">
					<div className="grid">
						{node.inputs?.map((input) => {
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
					</div>

					<div className="grid">
						{node.outputs?.map((output) => {
							const isConnected = connectedOutputIds?.some(
								(connectedOutputId) => connectedOutputId === output.id,
							);
							return (
								<div
									className="relative group flex items-center h-[28px]"
									data-connected={isConnected}
									key={output.id}
								>
									<Handle
										id={output.id}
										type="source"
										position={Position.Right}
										style={
											!isConnected
												? {
														background: "var(--color-background)",
														borderColor: "var(--color-border)",
													}
												: undefined
										}
										className={clsx(
											"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !right-[-0.5px]",
											// When disconnected, background is set via inline style to match canvas background
											v.isTextGeneration &&
												"group-data-[connected=true]:!border-generation-node-1",
											v.isImageGeneration &&
												"group-data-[connected=true]:!border-image-generation-node-1",
											v.isGithub &&
												"group-data-[connected=true]:!border-github-node-1",
											v.isVectorStoreGithub &&
												"group-data-[connected=true]:!border-github-node-1",
											v.isVectorStoreGithubPullRequest &&
												"group-data-[connected=true]:!border-github-node-1",
											v.isText &&
												"group-data-[connected=true]:!border-text-node-1",
											v.isFile &&
												"group-data-[connected=true]:!border-file-node-1",
											v.isWebPage &&
												"group-data-[connected=true]:!border-webPage-node-1",
											v.isWebSearch &&
												"group-data-[connected=true]:!border-web-search-node-1",
											v.isAudioGeneration &&
												"group-data-[connected=true]:!border-audio-generation-node-1",
											v.isVideoGeneration &&
												"group-data-[connected=true]:!border-video-generation-node-1",
											v.isTrigger &&
												"group-data-[connected=true]:!border-trigger-node-1",
											v.isAction &&
												"group-data-[connected=true]:!border-action-node-1",
											v.isQuery &&
												"group-data-[connected=true]:!border-query-node-1",
											isConnected &&
												v.isTextGeneration &&
												"!bg-generation-node-1",
											isConnected &&
												v.isImageGeneration &&
												"!bg-image-generation-node-1",
											isConnected && v.isGithub && "!bg-github-node-1",
											isConnected &&
												(v.isVectorStoreGithub ||
													v.isVectorStoreGithubPullRequest) &&
												"!bg-github-node-1",
											isConnected &&
												v.isText &&
												"!bg-text-node-1 !border-text-node-1",
											isConnected &&
												v.isFile &&
												"!bg-file-node-1 !border-file-node-1",
											isConnected &&
												v.isWebPage &&
												"!bg-webPage-node-1 !border-webPage-node-1",
											isConnected &&
												v.isWebSearch &&
												"!bg-web-search-node-1 !border-web-search-node-1",
											isConnected &&
												v.isAudioGeneration &&
												"!bg-audio-generation-node-1 !border-audio-generation-node-1",
											isConnected &&
												v.isVideoGeneration &&
												"!bg-video-generation-node-1 !border-video-generation-node-1",
											isConnected &&
												v.isTrigger &&
												"!bg-trigger-node-1 !border-trigger-node-1",
											isConnected &&
												v.isAction &&
												"!bg-action-node-1 !border-action-node-1",
											isConnected &&
												v.isQuery &&
												"!bg-query-node-1 !border-query-node-1",
										)}
									/>
									<div
										className={clsx(
											"text-[12px]",
											isConnected
												? "px-[16px] text-inverse"
												: "absolute -right-[12px] whitespace-nowrap translate-x-[100%] text-text-muted",
										)}
									>
										{output.label}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
