import type {
	ImageGenerationContent,
	ImageGenerationNode,
} from "@giselle-sdk/data-type";
import type { Generation } from "@giselle-sdk/giselle";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { useCallback } from "react";
import { GenerateImageIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { GenerationView } from "../../../ui/generation-view";

function Empty({ onGenerate }: { onGenerate?: () => void }) {
	return (
		<div className="bg-white-900/10 h-full rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<GenerateImageIcon width={24} height={24} />}
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

// Helper function to get LLM provider display name
function getProviderDisplayName(provider: string): string {
	switch (provider) {
		case "fal":
			return "Fal";
		case "openai":
			return "OpenAI";
		default:
			return provider;
	}
}

// Helper function to get model info from generation context
function getGenerationModelInfo(generation: Generation): {
	provider: string;
	modelId: string;
} {
	if (
		generation.context.operationNode.content.type === "imageGeneration" &&
		"llm" in generation.context.operationNode.content
	) {
		const content = generation.context.operationNode
			.content as ImageGenerationContent;
		return {
			provider: content.llm?.provider || "Unknown",
			modelId: content.llm?.id || "",
		};
	}
	return { provider: "Unknown", modelId: "" };
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
		<div className="flex flex-col bg-white-900/10 h-full rounded-[8px] py-[8px]">
			<div
				className={clsx(
					"border-b border-white-400/20 py-[4px] px-[16px] flex items-center gap-[8px]",
					"**:data-header-text:font-[700]",
				)}
			>
				{(currentGeneration.status === "created" ||
					currentGeneration.status === "queued" ||
					currentGeneration.status === "running") && (
					<p data-header-text>
						Result{" "}
						<span className="text-[12px] font-normal">
							from {(() => {
								const modelInfo = getGenerationModelInfo(currentGeneration);
								return `${getProviderDisplayName(modelInfo.provider)} ${modelInfo.modelId}`;
							})()}
						</span>
					</p>
				)}
				{currentGeneration.status === "completed" && (
					<p data-header-text>
						Result{" "}
						<span className="text-[12px] font-normal">
							from {(() => {
								const modelInfo = getGenerationModelInfo(currentGeneration);
								return `${getProviderDisplayName(modelInfo.provider)} ${modelInfo.modelId}`;
							})()}
						</span>
					</p>
				)}
				{currentGeneration.status === "failed" && <p data-header-text>Error</p>}
				{currentGeneration.status === "cancelled" && (
					<p data-header-text>
						Result{" "}
						<span className="text-[12px] font-normal">
							from {(() => {
								const modelInfo = getGenerationModelInfo(currentGeneration);
								return `${getProviderDisplayName(modelInfo.provider)} ${modelInfo.modelId}`;
							})()}
						</span>
					</p>
				)}
			</div>
			<div className="flex-1 py-[4px] px-[16px] overflow-y-auto">
				<GenerationView generation={currentGeneration} />
			</div>
		</div>
	);
}
