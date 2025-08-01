import type { Generation } from "@giselle-sdk/giselle";
import clsx from "clsx/lite";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { GitHubIcon, WilliIcon } from "../icons";

function Spinner() {
	return (
		<div className="flex gap-[12px] text-black-400">
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-1" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-2" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-3" />
		</div>
	);
}

function ScoreIndicator({ score }: { score: number }) {
	const getScoreColor = (score: number) => {
		if (score > 0.8) return "bg-green-500";
		if (score > 0.5) return "bg-yellow-500";
		return "bg-gray-500";
	};

	const getScoreText = (score: number) => {
		if (score > 0.8) return "text-green-400";
		if (score > 0.5) return "text-yellow-400";
		return "text-gray-400";
	};

	return (
		<div className="flex items-center gap-[8px]">
			<div className="w-[60px] h-[4px] bg-gray-700 rounded-full overflow-hidden">
				<div
					className={clsx(
						"h-full rounded-full transition-all",
						getScoreColor(score),
					)}
					style={{ width: `${score * 100}%` }}
				/>
			</div>
			<span className={clsx("text-[12px] font-medium", getScoreText(score))}>
				{score.toFixed(2)}
			</span>
		</div>
	);
}

function ContentPreview({
	content,
	isExpanded,
	onToggle,
}: {
	content: string;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const shouldShowToggle = content.length > 200;
	const displayContent =
		isExpanded || !shouldShowToggle ? content : `${content.slice(0, 200)}...`;

	return (
		<div className="space-y-[8px]">
			<pre className="text-[12px] text-white-800 whitespace-pre-wrap font-mono leading-relaxed">
				{displayContent}
			</pre>
			{shouldShowToggle && (
				<button
					type="button"
					aria-expanded={isExpanded}
					aria-controls={`content-${content.slice(0, 20).replace(/\s/g, "-")}`}
					onClick={onToggle}
					className="flex items-center gap-[4px] text-[12px] text-blue-400 hover:text-blue-300 transition-colors"
				>
					{isExpanded ? (
						<>
							<ChevronDownIcon className="w-[14px] h-[14px]" />
							Show less
						</>
					) : (
						<>
							<ChevronRightIcon className="w-[14px] h-[14px]" />
							Show more
						</>
					)}
				</button>
			)}
		</div>
	);
}

type QueryResultRecord = {
	chunkContent: string;
	chunkIndex: number;
	score: number;
	metadata: Record<string, string>;
};

type QueryResultData = {
	type: string;
	source?: {
		provider: string;
		state: {
			status: string;
			owner?: string;
			repo?: string;
		};
	};
	records?: QueryResultRecord[];
};

type DataSourceDisplayInfo = {
	line1: string;
	line2?: string;
};

function getDataSourceDisplayInfo(
	result: QueryResultData,
): DataSourceDisplayInfo {
	if (
		result.source?.provider === "github" &&
		result.source.state.status === "configured" &&
		result.source.state.owner &&
		result.source.state.repo
	) {
		return {
			line1: `${result.source.state.owner}/${result.source.state.repo}`,
			line2: "Code",
		};
	}
	if (
		result.source?.provider === "githubPullRequest" &&
		result.source.state.status === "configured" &&
		result.source.state.owner &&
		result.source.state.repo
	) {
		return {
			line1: `${result.source.state.owner}/${result.source.state.repo}`,
			line2: "Pull Requests",
		};
	}
	if (result.source?.provider) {
		return {
			line1: `${result.source.provider} vector store`,
		};
	}
	return {
		line1: "Unknown source",
	};
}

function DataSourceTab({
	result,
	isActive,
	onClick,
}: {
	result: QueryResultData;
	isActive: boolean;
	onClick: () => void;
}) {
	const displayInfo = getDataSourceDisplayInfo(result);
	const recordCount = result.records?.length || 0;
	const isGitHub =
		result.source?.provider === "github" ||
		result.source?.provider === "githubPullRequest";

	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"flex items-center gap-[8px] px-[16px] py-[6px] border-b cursor-pointer min-w-fit flex-shrink-0",
				isActive
					? "text-white-900 border-white-900"
					: "text-black-400 border-transparent",
			)}
		>
			{isGitHub && <GitHubIcon className="w-[14px] h-[14px] flex-shrink-0" />}
			<div className="flex flex-col items-start leading-tight whitespace-nowrap">
				<span className="text-[13px] font-medium">{displayInfo.line1}</span>
				{displayInfo.line2 && (
					<span className="text-[11px] opacity-70">{displayInfo.line2}</span>
				)}
			</div>
			<div
				className={clsx(
					"flex items-center gap-[4px] px-[6px] py-[1px] rounded-[6px] flex-shrink-0",
					isActive
						? "bg-blue-500/20 text-blue-300"
						: "bg-white-900/10 text-white-700",
				)}
			>
				<span className="text-[11px] font-medium">{recordCount}</span>
			</div>
		</button>
	);
}

function QueryResultCard({ result }: { result: QueryResultData }) {
	const [expandedRecords, setExpandedRecords] = useState<Set<number>>(
		new Set(),
	);

	const toggleRecord = (recordIndex: number) => {
		setExpandedRecords((prev) => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(recordIndex)) {
				newExpanded.delete(recordIndex);
			} else {
				newExpanded.add(recordIndex);
			}
			return newExpanded;
		});
	};

	if (result.type !== "vector-store") {
		return (
			<div className="bg-white-900/5 rounded-[8px] p-[16px] border border-white-900/10">
				<p className="text-white-600 text-[14px]">
					Unsupported result type: {result.type}
				</p>
			</div>
		);
	}

	const { records } = result;
	if (!records) {
		return (
			<div className="bg-white-900/5 rounded-[8px] p-[16px] border border-white-900/10">
				<p className="text-white-600 text-[14px]">No records found</p>
			</div>
		);
	}

	return (
		<div className="space-y-[12px]">
			{records.map((record, recordIndex) => (
				<div
					key={`record-${recordIndex}-${record.chunkIndex}`}
					className="bg-white-900/5 rounded-[8px] p-[12px] space-y-[8px] border border-white-900/10"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-[8px] flex-wrap">
							<span className="text-[12px] font-semibold text-white-700">
								Chunk #{record.chunkIndex}
							</span>
						</div>
						<ScoreIndicator score={record.score} />
					</div>

					<ContentPreview
						content={record.chunkContent}
						isExpanded={expandedRecords.has(recordIndex)}
						onToggle={() => toggleRecord(recordIndex)}
					/>

					{Object.keys(record.metadata).length > 0 && (
						<details className="text-[11px] text-white-500">
							<summary className="cursor-pointer hover:text-white-400">
								Metadata
							</summary>
							<div className="mt-[4px] pl-[12px] space-y-[2px]">
								{Object.entries(record.metadata).map(([key, value]) => (
									<div key={key} className="flex gap-[8px]">
										<span className="font-medium">{key}:</span>
										<span className="break-all">{String(value)}</span>
									</div>
								))}
							</div>
						</details>
					)}
				</div>
			))}
		</div>
	);
}

export function QueryResultView({ generation }: { generation: Generation }) {
	const [activeTabIndex, setActiveTabIndex] = useState(0);

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

	if (generation.status !== "completed") {
		return null;
	}
	const queryResults = getGenerationQueryResult(generation);

	if (queryResults.length === 0) {
		return (
			<div className="text-white-600 text-[14px] p-[16px] bg-white-900/5 rounded-[8px] border border-white-900/10 text-center">
				No results found.
			</div>
		);
	}

	const activeResult = queryResults[activeTabIndex];
	const totalRecords = queryResults.reduce(
		(sum, result) => sum + (result.records?.length || 0),
		0,
	);

	return (
		<div className="space-y-[16px]">
			{/* Header */}
			<div className="flex items-center gap-[12px] py-[8px]">
				<p className="text-[12px] text-white-600">
					Found {totalRecords} result{totalRecords !== 1 ? "s" : ""} in{" "}
					{queryResults.length} data source
					{queryResults.length !== 1 ? "s" : ""}
				</p>
			</div>

			{/* Tab Navigation */}
			<div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
				<div className="flex gap-[0px] flex-nowrap">
					{queryResults.map((result, index) => (
						<DataSourceTab
							key={`datasource-${index}-${result.source?.provider || "unknown"}-${result.source?.state?.owner || ""}-${result.source?.state?.repo || ""}`}
							result={result}
							isActive={activeTabIndex === index}
							onClick={() => setActiveTabIndex(index)}
						/>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<div>{activeResult && <QueryResultCard result={activeResult} />}</div>
		</div>
	);
}

function getGenerationQueryResult(generation: Generation): QueryResultData[] {
	if (generation.status !== "completed") {
		throw new Error("Generation is not completed");
	}
	const queryResultOutputs = generation.outputs.filter(
		(output) => output.type === "query-result",
	);

	// Flatten all query results from all outputs
	const allResults: QueryResultData[] = [];
	for (const output of queryResultOutputs) {
		if (output.type === "query-result") {
			allResults.push(...output.content);
		}
	}

	return allResults;
}
