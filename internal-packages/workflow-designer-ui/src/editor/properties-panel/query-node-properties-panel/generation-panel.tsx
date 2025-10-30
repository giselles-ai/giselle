import type { QueryNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { StackBlicksIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import { QueryResultView } from "../../../ui/query-result-view";

function Empty() {
	return (
		<div className="bg-inverse/10 min-h-[220px] rounded-[8px] flex justify-center items-center text-black-400">
			<EmptyState
				icon={<StackBlicksIcon />}
				title="Nothing generated yet."
				description="Run a query to see the results."
				className="text-black-400"
			/>
		</div>
	);
}

export function GenerationPanel({ node }: { node: QueryNode }) {
	const { data } = useWorkflowDesigner();
	const { currentGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});

	if (currentGeneration === undefined) {
		return <Empty />;
	}
	return (
		<div className="flex flex-col bg-inverse/10 rounded-[8px] py-[8px] min-h-[220px]">
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
