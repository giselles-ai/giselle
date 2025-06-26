import type {
	Generation,
	ImageGenerationNode,
	TextGenerationNode,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useEffect, useState } from "react";
import { StackBlicksIcon, WilliIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { GenerationView } from "../../../ui/generation-view";
import { COMMON_STYLES, EmptyGenerationState } from "../ui";
import {
	getGenerationContentClasses,
	getGenerationHeaderClasses,
} from "../ui/panel-spacing";

export function GenerationPanel({
	node,
	onClickGenerateButton,
}: {
	node: ImageGenerationNode;
	onClickGenerateButton?: () => void;
}) {
	const { data } = useWorkflowDesigner();
	const { generations } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "workspace", id: data.id },
	});
	const [currentGeneration, setCurrentGeneration] = useState<
		Generation | undefined
	>();

	useEffect(() => {
		if (generations.length === 0) {
			setCurrentGeneration(undefined);
		} else {
			const latestGeneration = generations[generations.length - 1];
			setCurrentGeneration(latestGeneration);
		}
	}, [generations]);

	const handleGenerate = useCallback(() => {
		if (onClickGenerateButton) {
			onClickGenerateButton();
		}
	}, [onClickGenerateButton]);

	if (currentGeneration === undefined) {
		return <EmptyGenerationState onGenerate={handleGenerate} />;
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
