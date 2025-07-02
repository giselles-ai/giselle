import type { ActionNode, Generation } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { useEffect, useState } from "react";

export function GenerationPanel({ node }: { node: ActionNode }) {
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
		return null;
	}

	return (
		<div className="flex flex-col bg-white-900/10 h-full rounded-[8px] py-[8px]">
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
						<p data-header-text>Running...</p>
					)}
					{currentGeneration.status === "completed" && (
						<p data-header-text>Result(Beta)</p>
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
				{currentGeneration.status === "completed" &&
					currentGeneration.outputs.map((output) => {
						if (output.type !== "generated-text") {
							return null;
						}
						return output.content;
					})}
			</div>
		</div>
	);
}
