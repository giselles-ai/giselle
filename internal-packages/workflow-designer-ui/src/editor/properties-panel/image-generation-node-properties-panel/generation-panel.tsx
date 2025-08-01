import type { ImageGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { useCallback } from "react";
import { StackBlicksIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { GenerationView } from "../../../ui/generation-view";
import {
	getGenerationContentClasses,
	getGenerationHeaderClasses,
} from "../ui/panel-spacing";

function Empty({ onGenerate }: { onGenerate?: () => void }) {
	return (
		<div className="bg-white-900/10 h-full rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<StackBlicksIcon />}
				title="Nothing generated yet."
				description="Generate with the current Prompt or adjust the Prompt and the results will be displayed."
				className="text-black-400"
			>
				{onGenerate && (
					<button
						type="button"
						onClick={onGenerate}
						className="flex items-center justify-center px-[24px] py-[12px] mt-[16px] bg-[#141519] text-white rounded-[9999px] border border-white-900/15 transition-all hover:bg-[#1e1f26] hover:border-white-900/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px]"
					>
						<span className="mr-[8px] generate-star">✦</span>
						Generate with the Current Prompt
					</button>
				)}
				<style jsx>{`
          .generate-star {
            display: inline-block;
          }
          button:hover .generate-star {
            animation: rotateStar 0.7s ease-in-out;
          }
          @keyframes rotateStar {
            0% {
              transform: rotate(0deg) scale(1);
            }
            50% {
              transform: rotate(180deg) scale(1.5);
            }
            100% {
              transform: rotate(360deg) scale(1);
            }
          }
        `}</style>
			</EmptyState>
		</div>
	);
}

export function GenerationPanel({
	node,
	onClickGenerateButton,
}: {
	node: ImageGenerationNode;
	onClickGenerateButton?: () => void;
}) {
	const { data } = useWorkflowDesigner();
	const { currentGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});

	const handleGenerate = useCallback(() => {
		if (onClickGenerateButton) {
			onClickGenerateButton();
		}
	}, [onClickGenerateButton]);

	if (currentGeneration === undefined) {
		return <Empty onGenerate={handleGenerate} />;
	}
	return (
		<div className="bg-white-900/10 h-full rounded-[8px] flex flex-col">
			<div className={clsx(getGenerationHeaderClasses())}>
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
			<div className={getGenerationContentClasses()}>
				<div className="h-full overflow-x-auto">
					<GenerationView generation={currentGeneration} />
				</div>
			</div>
		</div>
	);
}
