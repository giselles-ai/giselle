import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-ai/giselle/react";
import type { ImageGenerationNode } from "@giselle-ai/protocol";
import clsx from "clsx/lite";
import { Maximize2 } from "lucide-react";
import { useCallback } from "react";
import { GenerateImageIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { GenerationView } from "../../../ui/generation-view";

function Empty() {
	return (
		<div className="relative bg-inverse/10 min-h-[250px] rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<GenerateImageIcon width={24} height={24} />}
				title="Nothing generated yet."
				description="Generate or adjust the Prompt to see results."
				className="text-black-400"
			/>
		</div>
	);
}

export function GenerationPanel({
	node,
	onClickGenerateButton,
	onExpand,
	isExpanded,
}: {
	node: ImageGenerationNode;
	onClickGenerateButton?: () => void;
	onExpand?: () => void;
	isExpanded?: boolean;
}) {
	const { data } = useWorkflowDesigner();
	const { currentGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});

	const _handleGenerate = useCallback(() => {
		if (onClickGenerateButton) {
			onClickGenerateButton();
		}
	}, [onClickGenerateButton]);

	if (currentGeneration === undefined) {
		return <Empty />;
	}
	return (
		<div
			className={clsx(
				"relative flex flex-col bg-inverse/10 rounded-[8px] py-[8px]",
				isExpanded ? "flex-1 min-h-0" : "min-h-[250px]",
			)}
		>
			{onExpand && (
				<button
					type="button"
					onClick={onExpand}
					className="absolute bottom-[8px] right-[8px] size-[32px] rounded-full bg-inverse/10 hover:bg-inverse/20 flex items-center justify-center transition-colors group z-10"
					aria-label="Expand"
				>
					<Maximize2 className="size-[16px] text-inverse group-hover:text-inverse/80" />
				</button>
			)}
			<div
				className={clsx(
					"border-b border-white-400/20 py-[4px] px-[16px] flex items-center gap-[8px]",
					"**:data-header-text:font-[700]",
				)}
			>
				{(currentGeneration.status === "created" ||
					currentGeneration.status === "queued" ||
					currentGeneration.status === "running") && (
					<p data-header-text>Generating...</p>
				)}
				{currentGeneration.status === "completed" && (
					<p data-header-text>Result</p>
				)}
				{currentGeneration.status === "failed" && <p data-header-text>Error</p>}
				{currentGeneration.status === "cancelled" && (
					<p data-header-text>Result</p>
				)}
			</div>
			<div className="flex-1 py-[4px] px-[16px] overflow-y-auto">
				<GenerationView generation={currentGeneration} />
			</div>
		</div>
	);
}
