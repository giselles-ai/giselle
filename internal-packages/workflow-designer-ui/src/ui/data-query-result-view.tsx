import type { Generation } from "@giselles-ai/protocol";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { WilliIcon } from "../icons";

function Spinner() {
	return (
		<div className="flex gap-[12px] text-text-muted">
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-1" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-2" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-3" />
		</div>
	);
}

export function DataQueryResultView({
	generation,
}: {
	generation: Generation;
}) {
	const [isJsonExpanded, setIsJsonExpanded] = useState(true);

	if (generation.status === "failed") {
		return (
			<div className="text-red-400 text-[14px] p-[16px] bg-red-900/10 rounded-[8px] border border-red-900/20">
				{generation.error.message}
			</div>
		);
	}

	if (generation.status !== "completed" && generation.status !== "cancelled") {
		return (
			<div className="pt-[8px]">
				<Spinner />
			</div>
		);
	}

	if (generation.status === "cancelled") {
		return (
			<div className="text-text-muted text-[14px] p-[16px] bg-surface/5 rounded-[8px] border border-border/10 text-center">
				Query execution was cancelled.
			</div>
		);
	}

	const dataQueryResults = getDataQueryResults(generation);

	if (dataQueryResults.length === 0) {
		return (
			<div className="text-inverse text-[14px] p-[16px] bg-surface/5 rounded-[8px] border border-border/10 text-center">
				No results found.
			</div>
		);
	}

	const result = dataQueryResults[0];

	return (
		<div className="space-y-[16px]">
			{/* Header */}
			<div className="flex items-center justify-between py-[8px]">
				<p className="text-[12px] text-inverse">
					{result.rowCount} row{result.rowCount !== 1 ? "s" : ""} returned
				</p>
				<button
					type="button"
					onClick={() => setIsJsonExpanded(!isJsonExpanded)}
					className="flex items-center gap-[4px] text-[12px] text-blue-400 hover:text-blue-300 transition-colors"
				>
					{isJsonExpanded ? (
						<>
							<ChevronDownIcon className="w-[14px] h-[14px]" />
							Collapse
						</>
					) : (
						<>
							<ChevronRightIcon className="w-[14px] h-[14px]" />
							Expand
						</>
					)}
				</button>
			</div>

			{/* Query Info */}
			{result.query && (
				<div className="bg-surface/5 rounded-[8px] p-[12px] border border-border/10">
					<p className="text-[11px] text-text-muted mb-[4px]">
						Executed Query:
					</p>
					<pre className="text-[12px] text-inverse font-mono whitespace-pre-wrap break-all">
						{result.query}
					</pre>
				</div>
			)}

			{/* Results */}
			{isJsonExpanded && (
				<div className="bg-surface/5 rounded-[8px] p-[12px] border border-border/10 overflow-auto max-h-[400px]">
					{result.rows.length > 0 ? (
						<pre className="text-[12px] text-inverse font-mono whitespace-pre-wrap">
							{JSON.stringify(result.rows, null, 2)}
						</pre>
					) : (
						<p className="text-[12px] text-text-muted text-center py-[16px]">
							Query executed successfully but returned no rows.
						</p>
					)}
				</div>
			)}
		</div>
	);
}

interface DataQueryResult {
	type: "data-query";
	dataStoreId: string;
	rows: Array<Record<string, unknown>>;
	rowCount: number;
	query: string;
}

function getDataQueryResults(generation: Generation): DataQueryResult[] {
	if (generation.status !== "completed") {
		return [];
	}

	const results: DataQueryResult[] = [];
	for (const output of generation.outputs) {
		if (output.type === "data-query-result") {
			results.push(output.content as DataQueryResult);
		}
	}

	return results;
}
