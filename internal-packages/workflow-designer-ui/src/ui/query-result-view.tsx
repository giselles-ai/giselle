import {
	type Generation,
	isCompletedGeneration,
	isFailedGeneration,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { GitHubIcon, WilliIcon } from "../icons";

// Score display constants for better performance
const SCORE_THRESHOLDS = {
	HIGH: 0.8,
	MEDIUM: 0.5,
} as const;

const SCORE_COLORS = {
	HIGH: "bg-green-500",
	MEDIUM: "bg-yellow-500",
	LOW: "bg-gray-500",
} as const;

const SCORE_TEXT_COLORS = {
	HIGH: "text-green-400",
	MEDIUM: "text-yellow-400",
	LOW: "text-gray-400",
} as const;

const getScoreColor = (score: number): string => {
	if (score > SCORE_THRESHOLDS.HIGH) return SCORE_COLORS.HIGH;
	if (score > SCORE_THRESHOLDS.MEDIUM) return SCORE_COLORS.MEDIUM;
	return SCORE_COLORS.LOW;
};

const getScoreTextColor = (score: number): string => {
	if (score > SCORE_THRESHOLDS.HIGH) return SCORE_TEXT_COLORS.HIGH;
	if (score > SCORE_THRESHOLDS.MEDIUM) return SCORE_TEXT_COLORS.MEDIUM;
	return SCORE_TEXT_COLORS.LOW;
};

// Common UI component styles
const CARD_STYLES = {
	base: "bg-white-900/5 rounded-[8px] border border-white-900/10",
	record: "p-[12px] space-y-[8px]",
	message: "p-[16px]",
} as const;

const TEXT_STYLES = {
	chunk: "text-[12px] font-semibold text-white-700",
	tabLabel: "text-[13px] font-medium",
	recordCount: "text-[11px] font-medium",
	content:
		"text-[12px] text-white-800 whitespace-pre-wrap font-mono leading-relaxed",
	header: "text-[12px] text-white-600",
} as const;

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
			<span
				className={clsx("text-[12px] font-medium", getScoreTextColor(score))}
			>
				{(score * 100).toFixed(0)}%
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
			<pre className={TEXT_STYLES.content}>{displayContent}</pre>
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

function getDataSourceDisplayName(result: QueryResultData): string {
	if (
		result.source?.provider === "github" &&
		result.source.state.status === "configured" &&
		result.source.state.owner &&
		result.source.state.repo
	) {
		return `${result.source.state.owner}/${result.source.state.repo}`;
	}
	if (result.source?.provider) {
		return `${result.source.provider} vector store`;
	}
	return "Unknown source";
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
	const displayName = getDataSourceDisplayName(result);
	const recordCount = result.records?.length || 0;
	const isGitHub = result.source?.provider === "github";

	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"flex items-center gap-[8px] px-[16px] py-[4px] border-b cursor-pointer",
				isActive
					? "text-white-900 border-white-900"
					: "text-black-400 border-transparent",
			)}
		>
			{isGitHub && <GitHubIcon className="w-[14px] h-[14px]" />}
			<span className={TEXT_STYLES.tabLabel}>{displayName}</span>
			<div
				className={clsx(
					"flex items-center gap-[4px] px-[6px] py-[1px] rounded-[6px]",
					isActive
						? "bg-blue-500/20 text-blue-300"
						: "bg-white-900/10 text-white-700",
				)}
			>
				<span className={TEXT_STYLES.recordCount}>{recordCount}</span>
			</div>
		</button>
	);
}

function QueryResultCard({ result }: { result: QueryResultData }) {
	const [expandedRecords, setExpandedRecords] = useState<Set<number>>(
		new Set(),
	);

	const toggleRecord = (recordIndex: number) => {
		const newExpanded = new Set(expandedRecords);
		if (newExpanded.has(recordIndex)) {
			newExpanded.delete(recordIndex);
		} else {
			newExpanded.add(recordIndex);
		}
		setExpandedRecords(newExpanded);
	};

	if (result.type !== "vector-store") {
		return (
			<div className={clsx(CARD_STYLES.base, CARD_STYLES.message)}>
				<p className="text-white-600 text-[14px]">
					Unsupported result type: {result.type}
				</p>
			</div>
		);
	}

	const { records } = result;
	if (!records) {
		return (
			<div className={clsx(CARD_STYLES.base, CARD_STYLES.message)}>
				<p className="text-white-600 text-[14px]">No records found</p>
			</div>
		);
	}

	return (
		<div className="space-y-[12px]">
			{records.map((record, recordIndex) => (
				<div
					key={`record-${recordIndex}-${record.chunkIndex}`}
					className={clsx(CARD_STYLES.base, CARD_STYLES.record)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-[8px] flex-wrap">
							<span className={TEXT_STYLES.chunk}>
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

	if (isFailedGeneration(generation)) {
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

	if (isCompletedGeneration(generation)) {
		const queryResults = getGenerationQueryResult(generation);

		if (queryResults.length === 0) {
			return (
				<div
					className={clsx(
						CARD_STYLES.base,
						CARD_STYLES.message,
						"text-white-600 text-[14px] text-center",
					)}
				>
					No search results found
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
					<p className={TEXT_STYLES.header}>
						Found {totalRecords} result{totalRecords !== 1 ? "s" : ""} in{" "}
						{queryResults.length} data source
						{queryResults.length !== 1 ? "s" : ""}
					</p>
				</div>

				{/* Tab Navigation */}
				<div>
					<div className="overflow-x-auto">
						<div className="flex gap-[0px] min-w-full">
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
				</div>

				{/* Tab Content */}
				<div>{activeResult && <QueryResultCard result={activeResult} />}</div>
			</div>
		);
	}

	return null;
}

function getGenerationQueryResult(generation: Generation): QueryResultData[] {
	if (!isCompletedGeneration(generation)) {
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
