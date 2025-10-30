import type { QueryNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { useCallback } from "react";
import { StackBlicksIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { QueryResultView } from "../../../ui/query-result-view";

function Empty({ onGenerate }: { onGenerate?: () => void }) {
	return (
		<div className="bg-inverse/10 h-full rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<StackBlicksIcon />}
				title="No query has been run yet."
				description="Run a query to see the results."
				className="text-black-400"
			>
				{onGenerate && (
					<button
						type="button"
						onClick={onGenerate}
						className="flex items-center justify-center px-[24px] py-[12px] mt-[16px] bg-background text-white rounded-[9999px] border border-border/15 transition-all hover:bg-inverse/5 hover:border-border/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px]"
					>
						<span className="mr-[8px] generate-star">✦</span>
						Run Query
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
	node: QueryNode;
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
		<div className="flex flex-col bg-inverse/10 h-full rounded-[8px] py-[8px]">
			<div
				className={clsx(
					"border-b border-white-400/20 py-[4px] px-[16px] flex items-center gap-[8px]",
					"**:data-header-text:font-[700]",
				)}
			>
				<div className="flex-1 flex items-center gap-[8px]">
					{(currentGeneration.status === "created" ||
						currentGeneration.status === "queued" ||
						currentGeneration.status === "running") && (
						<p data-header-text>Generating...</p>
					)}
					{currentGeneration.status === "completed" && (
						<p data-header-text>Result</p>
					)}
					{currentGeneration.status === "failed" && (
						<p data-header-text>Error</p>
					)}
					{currentGeneration.status === "cancelled" && (
						<p data-header-text>Result</p>
					)}
				</div>
			</div>
			<div className="flex-1 py-[4px] px-[16px] overflow-y-auto">
				<QueryResultView generation={currentGeneration} />
			</div>
		</div>
	);
}
