import type { Generation, TextGenerationNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { useEffect, useState } from "react";
import { StackBlicksIcon, WilliIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { GenerationView } from "../../../ui/generation-view";

function Empty() {
	return (
		<div className="bg-white-900/10 h-full rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<StackBlicksIcon />}
				title="Nothing is generated."
				description="Generate with the current Prompt or adjust the Prompt and the results will be displayed."
				className="text-black-400"
			/>
		</div>
	);
}

export function GenerationPanel({ node }: { node: TextGenerationNode }) {
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
	if (currentGeneration === undefined) {
		return <Empty />;
	}
	return (
		<div className="bg-white-900/10 h-full rounded-[8px] py-[8px]">
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
			<div className="py-[4px] px-[16px] overflow-y-auto h-full">
				<GenerationView generation={currentGeneration} />
			</div>
		</div>
	);
}
