import type { DataQueryNode } from "@giselles-ai/protocol";
import { useNodeGenerations } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { useAppDesignerStore } from "../../../app-designer";
import { StackBlicksIcon } from "../../../icons";
import { DataQueryResultView } from "../../../ui/data-query-result-view";
import { EmptyState } from "../../../ui/empty-state";

function Empty() {
	return (
		<div className="bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] min-h-[220px] rounded-[8px] flex justify-center items-center text-link-muted">
			<EmptyState
				icon={<StackBlicksIcon />}
				title="Nothing generated yet."
				description="Run a SQL query to see the results."
				className="text-link-muted"
			/>
		</div>
	);
}

export function DataQueryGenerationPanel({ node }: { node: DataQueryNode }) {
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const { currentGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId },
	});

	if (currentGeneration === undefined) {
		return <Empty />;
	}
	return (
		<div className="flex flex-col bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] rounded-[8px] py-[8px] min-h-[220px]">
			<div
				className={clsx(
					"border-b border-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] py-[4px] px-[16px] flex items-center gap-[8px]",
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
						<p data-header-text>Cancelled</p>
					)}
				</div>
			</div>
			<div className="flex-1 py-[4px] px-[16px] overflow-y-auto">
				<DataQueryResultView generation={currentGeneration} />
			</div>
		</div>
	);
}
