import { defaultName } from "@giselles-ai/node-registry";
import type {
	InputId,
	NodeId,
	NodeLike,
	OutputId,
} from "@giselles-ai/protocol";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import clsx from "clsx/lite";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../app-designer";
import { NodeIcon } from "../../icons/node";
import { NodeGenerationStatusBadge } from "./node-generation-status-badge";
import { useNodeGenerationStatus } from "./node-utils";

export function PillXyFlowNode({ id, selected }: NodeProps) {
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
		<PillNode
			node={node}
			selected={selected}
			highlighted={highlighted}
			connectedInputIds={connectedInputIds}
			connectedOutputIds={connectedOutputIds}
		/>
	);
}

export function PillNode({
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
	const { currentGeneration, stopCurrentGeneration, showCompleteLabel } =
		useNodeGenerationStatus(node.id as NodeId);
	const isStartNodeConnectedToEndNode = useAppDesignerStore((s) =>
		s.isStartNodeConnectedToEndNode(),
	);

	const isAppEntryAnyOutputConnected = connectedOutputIds.length > 0;
	const endPrimaryInputId = node.inputs?.[0]?.id ?? "blank-handle";
	const isEndAnyInputConnected =
		(connectedInputIds?.length ?? 0) > 0 ||
		connectedInputIds?.some((id) => id === endPrimaryInputId);

	const isAppEntry = node.content.type === "appEntry";
	const isEnd = node.content.type === "end";
	const requiresSetup = !isStartNodeConnectedToEndNode;

	const stageBgClass =
		"bg-[color:color-mix(in_srgb,var(--color-stage-node-1,var(--color-blue-muted))_80%,transparent)]" as const;
	const stageBackgroundClass =
		(isAppEntry || isEnd) && !requiresSetup ? stageBgClass : undefined;

	return (
		<div
			data-type={node.type}
			data-content-type={node.content.type}
			data-selected={selected}
			data-highlighted={highlighted}
			data-preview={preview}
			data-current-generation-status={currentGeneration?.status}
			className={clsx(
				"group relative rounded-full",
				"flex items-center gap-[8px] px-[14px] py-[8px] rounded-full",
				"backdrop-blur-[4px]",
				selected || highlighted
					? "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)] shadow-trigger-node-1"
					: "shadow-[4px_4px_8px_4px_rgba(0,_0,_0,_0.5)]",
				preview && "opacity-50",
				stageBackgroundClass,
				!stageBackgroundClass && requiresSetup ? "opacity-80" : undefined,
				!stageBackgroundClass && !requiresSetup ? "bg-trigger-node-1" : undefined,
			)}
		>
			<NodeGenerationStatusBadge
				node={node}
				currentGeneration={currentGeneration}
				showCompleteLabel={showCompleteLabel}
				onStopCurrentGeneration={stopCurrentGeneration}
			/>

			{selected && (
				<div
					className={clsx(
						"absolute inset-0 -z-10 pointer-events-none",
						"rounded-full",
						"shadow-[0_0_22px_4px_hsla(220,_15%,_50%,_0.7)]",
					)}
				/>
			)}
			<div
				className={clsx(
					"absolute z-0 inset-0 border-[1.5px] mask-fill",
					"rounded-full",
					"bg-gradient-to-br",
					requiresSetup
						? "border-black/60 border-dashed from-trigger-node-1/30 via-trigger-node-1/50 to-trigger-node-1"
						: "border-transparent from-inverse/80 via-inverse/30 to-inverse/60",
				)}
			/>
			{isAppEntry && (
				<Handle
					type="source"
					position={Position.Right}
					className={clsx(
						"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !right-[-0.5px] !top-1/2",
						"!border-[color:var(--color-stage-node-1,var(--color-blue-muted))]",
						isAppEntryAnyOutputConnected
							? "!bg-[color:var(--color-stage-node-1,var(--color-blue-muted))] [box-shadow:0_0_0_1.5px_rgba(0,0,0,0.8)]"
							: "!bg-background",
					)}
				/>
			)}
			{isEnd && (
				<Handle
					type="target"
					position={Position.Left}
					className={clsx(
						"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px] !left-[-0.5px] !top-1/2",
						"!border-[color:var(--color-stage-node-1,var(--color-blue-muted))]",
						isEndAnyInputConnected
							? "!bg-[color:var(--color-stage-node-1,var(--color-blue-muted))] [box-shadow:0_0_0_1.5px_rgba(0,0,0,0.8)]"
							: "!bg-background",
					)}
				/>
			)}
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
		</div>
	);
}
