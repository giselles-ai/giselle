import { defaultName } from "@giselles-ai/node-registry";
import type {
	InputId,
	NodeId,
	NodeLike,
	OutputId,
} from "@giselles-ai/protocol";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import clsx from "clsx/lite";
import { CheckIcon, SquareIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../app-designer";
import { NodeIcon } from "../../icons/node";
import {
	getCompletionLabel,
	nodeRequiresSetup,
	useNodeGenerationStatus,
} from "./node-utils";

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

function PillNode({
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
	const requiresSetup = nodeRequiresSetup(node);

	const appEntryPrimaryOutputId = node.outputs?.[0]?.id;
	const isAppEntryAnyOutputConnected = connectedOutputIds.length > 0;
	const endPrimaryInputId = node.inputs?.[0]?.id ?? "blank-handle";
	const isEndAnyInputConnected =
		(connectedInputIds?.length ?? 0) > 0 ||
		connectedInputIds?.some((id) => id === endPrimaryInputId);

	const isAppEntryPill = node.content.type === "appEntry";
	const isEndPill = node.content.type === "end";

	const nodeRadiusClass = "rounded-full";
	const nodeLayoutClass =
		"flex items-center gap-[8px] px-[14px] py-[8px] rounded-full";
	const stageShapeClass = "backdrop-blur-[4px]";
	const stageBackgroundClass =
		(isAppEntryPill || isEndPill) && !requiresSetup
			? "bg-trigger-node-1"
			: undefined;

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
						isAppEntryAnyOutputConnected ? "!bg-trigger-node-1" : "!bg-bg",
						"!border-trigger-node-1",
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
						isEndAnyInputConnected ? "!bg-trigger-node-1" : "!bg-bg",
						"!border-trigger-node-1",
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
			className={clsx(
				"group relative rounded-full",
				nodeLayoutClass,
				stageShapeClass,
				stageBackgroundClass,
				!selected &&
					!highlighted &&
					"shadow-[4px_4px_8px_4px_rgba(0,_0,_0,_0.5)]",
				selected && "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)]",
				selected && "shadow-trigger-node-1",
				highlighted && "shadow-[0px_0px_20px_1px_rgba(0,_0,_0,_0.4)]",
				highlighted && "shadow-trigger-node-1",
				preview && "opacity-50",
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

			{(isAppEntryPill || isEndPill) && selected && (
				<div
					className={clsx(
						"absolute inset-0 z-[-2] pointer-events-none",
						nodeRadiusClass,
						"shadow-[0_0_22px_4px_hsla(220,_15%,_50%,_0.7)]",
					)}
				/>
			)}
			<div
				className={clsx(
					"absolute z-0 inset-0 border-[1.5px] mask-fill",
					nodeRadiusClass,
					requiresSetup
						? "border-black/60 border-dashed [border-width:2px]"
						: "border-transparent",
					"bg-gradient-to-br",
					requiresSetup
						? "from-trigger-node-1/30 via-trigger-node-1/50 to-trigger-node-1"
						: "from-inverse/80 via-inverse/30 to-inverse/60",
				)}
			/>
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
		</div>
	);
}
