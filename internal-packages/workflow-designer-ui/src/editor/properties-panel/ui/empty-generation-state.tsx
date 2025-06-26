"use client";

import { StackBlicksIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { COMMON_STYLES } from "./common-styles";

interface EmptyGenerationStateProps {
	title?: string;
	description?: string;
	buttonText?: string;
	onGenerate?: () => void;
}

export function EmptyGenerationState({
	title = "Nothing generated yet.",
	description = "Generate with the current Prompt or adjust the Prompt and the results will be displayed.",
	buttonText = "Generate with the Current Prompt",
	onGenerate,
}: EmptyGenerationStateProps) {
	return (
		<div className="bg-white-900/10 h-full rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<StackBlicksIcon />}
				title={title}
				description={description}
				className="text-black-400"
			>
				{onGenerate && (
					<button
						type="button"
						onClick={onGenerate}
						className={COMMON_STYLES.generationButton}
					>
						<span className="mr-[8px] generate-star">✦</span>
						{buttonText}
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
						0% { transform: rotate(0deg) scale(1); }
						50% { transform: rotate(180deg) scale(1.5); }
						100% { transform: rotate(360deg) scale(1); }
					}
				`}</style>
			</EmptyState>
		</div>
	);
}
