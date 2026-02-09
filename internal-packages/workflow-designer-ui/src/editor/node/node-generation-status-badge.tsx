import type { NodeLike } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { CheckIcon, SquareIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getCompletionLabel } from "./node-utils";

type GenerationStatus =
	| "created"
	| "queued"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

export function NodeGenerationStatusBadge({
	node,
	currentGeneration,
	showCompleteLabel,
	onStopCurrentGeneration,
}: {
	node: NodeLike;
	currentGeneration?: { status: GenerationStatus } | undefined;
	showCompleteLabel: boolean;
	onStopCurrentGeneration: () => void;
}) {
	if (node.content.type === "trigger") {
		return null;
	}

	return (
		<>
			{currentGeneration?.status === "created" && (
				<div className="absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]">
					<div className="flex items-center">
						<p className="text-xs font-medium font-sans text-black-200">
							Waiting...
						</p>
					</div>
				</div>
			)}
			{(currentGeneration?.status === "queued" ||
				currentGeneration?.status === "running") && (
				<div className="absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]">
					<div className="flex items-center">
						<p className="text-xs font-medium font-sans bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[rgba(59,_130,_246,_1)] via-[rgba(255,_255,_255,_0.5)] to-[rgba(59,_130,_246,_1)] text-transparent animate-shimmer">
							Generating...
						</p>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onStopCurrentGeneration();
							}}
							className="ml-1 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
						>
							<SquareIcon className="w-2 h-2 text-white" fill="white" />
						</button>
					</div>
				</div>
			)}
			<AnimatePresence>
				{showCompleteLabel && (
					<motion.div
						className={clsx(
							"absolute top-[-28px] right-0 py-1 px-3 z-10 flex items-center justify-between rounded-t-[16px]",
							"text-green-900",
						)}
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
		</>
	);
}
