import type { Generation, GenerationId } from "@giselle-sdk/data-type";
import { useMemo } from "react";

export function GenerationCursor({
	generations,
	currentGenerationId,
	onPrevGenerationButtonClick,
	onNextGenerationButtonClick,
}: {
	generations: Generation[];
	currentGenerationId: GenerationId;
	onPrevGenerationButtonClick: () => void;
	onNextGenerationButtonClick: () => void;
}) {
	const hasPrevGeneration = useMemo(
		() => currentGenerationId !== generations[0]?.id,
		[generations, currentGenerationId],
	);
	const hasNextGeneration = useMemo(
		() => currentGenerationId !== generations[generations.length - 1]?.id,
		[generations, currentGenerationId],
	);
	const currentGenerationIndex = useMemo(
		() =>
			generations.findIndex(
				(generation) => generation.id === currentGenerationId,
			),
		[generations, currentGenerationId],
	);
	if (currentGenerationIndex === -1) {
		return null;
	}
	return (
		<div className="flex gap-[4px] text-[14px]">
			<button
				type="button"
				disabled={!hasPrevGeneration}
				className="text-black-300 hover:bg-white-900/20 px-[4px] disabled:text-black-70 rounded-[4px] disabled:hover:bg-transparent"
				onClick={onPrevGenerationButtonClick}
			>
				←
			</button>
			<p>
				Version {currentGenerationIndex + 1} of {generations.length}
			</p>
			<button
				type="button"
				disabled={!hasNextGeneration}
				className="text-black-300 hover:bg-white-900/20 px-[4px] disabled:text-black-70 rounded-[4px] disabled:hover:bg-transparent"
				onClick={onNextGenerationButtonClick}
			>
				→
			</button>
			{/* {generations.map((generation) => (
			  <Tabs.Trigger key={generation.id} value={generation.id}>
          {generation.id}
        </Tabs.Trigger>
			))}
			</Tabs.List>
			<Tabs.Content value="Prompt">Prompt</Tabs.Content>
			<Tabs.Content value="Result">Result</Tabs.Content>
		</Tabs.Root> */}
		</div>
	);
}
