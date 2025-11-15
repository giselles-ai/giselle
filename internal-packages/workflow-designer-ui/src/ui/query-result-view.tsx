import type { Generation } from "@giselles-ai/protocol";
import {
	useVectorStore,
	type VectorStoreContextValue,
} from "@giselles-ai/react";
import clsx from "clsx/lite";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	GitPullRequestIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { GitHubIcon, WilliIcon } from "../icons";
import { DocumentVectorStoreIcon } from "../icons/node/document-vector-store-icon";

const gitHubPRContextSchema = z.object({
	prContext: z.string().optional(),
});

function Spinner() {
	return (
		<div className="flex gap-[12px] text-text-muted">
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
			<pre className="text-[12px] text-inverse whitespace-pre-wrap font-mono leading-relaxed">
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

function PRContextDisplay({
	metadata,
	additional,
}: {
	metadata: Record<string, string>;
	additional?: Record<string, unknown>;
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	const additionalPRContext = additional
		? gitHubPRContextSchema.safeParse(additional).data
		: null;

	const prNumber = metadata.prNumber;
	const contentType = metadata.contentType;
	// Check both metadata and additional for prContext
	const prContextContent = additionalPRContext?.prContext;

	const parsedContext = useMemo(() => {
		if (!prContextContent) {
			return { title: "", body: null };
		}
		const [title, ...bodyParts] = prContextContent.split("\n\n");
		return {
			title: title || "",
			body: bodyParts.length > 0 ? bodyParts.join("\n\n") : null,
		};
	}, [prContextContent]);

	if (!prNumber || !prContextContent) {
		return null;
	}

	const contentTypeLabel =
		contentType === "comment"
			? "Comment"
			: contentType === "diff"
				? "Diff"
				: contentType === "title_body"
					? "Title & Body"
					: "Unknown";

	return (
		<div className="mt-[8px] p-[8px] bg-blue-500/10 rounded-[6px] border border-blue-500/20">
			<div className="flex items-start gap-[8px]">
				<GitPullRequestIcon className="w-[14px] h-[14px] text-blue-400 flex-shrink-0 mt-[2px]" />
				<div className="flex-1 space-y-[4px]">
					<div className="flex items-center gap-[6px] flex-wrap">
						<span className="text-[11px] font-medium text-blue-400">
							PR #{prNumber}
						</span>
						<span className="text-[11px] text-inverse">•</span>
						<span className="text-[11px] text-inverse">{contentTypeLabel}</span>
					</div>

					{parsedContext.title && (
						<p className="text-[12px] font-medium text-inverse leading-snug">
							{parsedContext.title}
						</p>
					)}

					{parsedContext.body && (
						<div>
							<button
								type="button"
								onClick={() => setIsExpanded(!isExpanded)}
								className="flex items-center gap-[4px] text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
							>
								{isExpanded ? (
									<>
										<ChevronDownIcon className="w-[12px] h-[12px]" />
										Hide PR description
									</>
								) : (
									<>
										<ChevronRightIcon className="w-[12px] h-[12px]" />
										Show PR description
									</>
								)}
							</button>
							{isExpanded && (
								<div className="mt-[6px] p-[8px] bg-surface/30 rounded-[4px]">
									<pre className="text-[11px] text-inverse whitespace-pre-wrap font-mono leading-relaxed">
										{parsedContext.body}
									</pre>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

type DocumentVectorStoreSummary = NonNullable<
	VectorStoreContextValue["documentStores"]
>[number];

type DataSourceDisplayInfo = {
	line1: string;
	line2?: string;
};

function summarizeDocumentStoreStatus(
	store: DocumentVectorStoreSummary | undefined,
): string | undefined {
	if (!store) {
		return undefined;
	}
	const total = store.sources.length;
	if (total === 0) {
		return "No uploads yet";
	}
	const failed = store.sources.filter(
		(source) => source.ingestStatus === "failed",
	).length;
	if (failed > 0) {
		return `${failed}/${total} failed`;
	}
	const running = store.sources.filter(
		(source) => source.ingestStatus === "running",
	).length;
	if (running > 0) {
		return `${running}/${total} processing`;
	}
	const completed = store.sources.filter(
		(source) => source.ingestStatus === "completed",
	).length;
	if (completed === total) {
		return `${total} ready`;
	}
	return `${completed}/${total} ready`;
}

function getDataSourceDisplayInfo(
	result: ReturnType<typeof getGenerationQueryResult>[number],
	documentStoreMap: Map<string, DocumentVectorStoreSummary>,
): DataSourceDisplayInfo {
	const { provider, state } = result.source;

	if (provider === "document") {
		if (state.status === "configured") {
			const storeId = state.documentVectorStoreId;
			const store = documentStoreMap.get(storeId);
			if (!store) {
				return {
					line1: storeId,
					line2: "Requires setup",
				};
			}
			return {
				line1: store.name,
				line2: summarizeDocumentStoreStatus(store),
			};
		}
		return {
			line1: "Document vector store",
			line2: "Requires setup",
		};
	}

	if (provider === "github" && state.status === "configured") {
		return {
			line1: `${state.owner}/${state.repo}`,
			line2: state.contentType === "pull_request" ? "Pull Requests" : "Code",
		};
	}

	return {
		line1: "Vector store",
	};
}

function DataSourceTab({
	result,
	isActive,
	onClick,
	documentStoreMap,
}: {
	result: ReturnType<typeof getGenerationQueryResult>[number];
	isActive: boolean;
	onClick: () => void;
	documentStoreMap: Map<string, DocumentVectorStoreSummary>;
}) {
	const displayInfo = getDataSourceDisplayInfo(result, documentStoreMap);
	const recordCount = result.records?.length || 0;
	const provider = result.source?.provider;
	const isGitHub = provider === "github";
	const isDocument = provider === "document";

	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"flex items-center gap-[8px] px-[16px] py-[6px] border-b cursor-pointer min-w-fit flex-shrink-0",
				isActive
					? "text-inverse border-border"
					: "text-text-muted border-transparent",
			)}
		>
			{isGitHub && <GitHubIcon className="w-[14px] h-[14px] flex-shrink-0" />}
			{isDocument && (
				<DocumentVectorStoreIcon
					className="w-[14px] h-[14px] flex-shrink-0"
					aria-hidden="true"
				/>
			)}
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
						: "bg-surface/10 text-inverse",
				)}
			>
				<span className="text-[11px] font-medium">{recordCount}</span>
			</div>
		</button>
	);
}

function QueryResultCard({
	result,
}: {
	result: ReturnType<typeof getGenerationQueryResult>[number];
}) {
	const [expandedRecords, setExpandedRecords] = useState<Set<number>>(
		new Set(),
	);
	const isDocumentResult = result.source.provider === "document";

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
			<div className="bg-surface/5 rounded-[8px] p-[16px] border border-border/10">
				<p className="text-inverse text-[14px]">
					Unsupported result type: {result.type}
				</p>
			</div>
		);
	}

	const { records } = result;
	if (!records) {
		return (
			<div className="bg-surface/5 rounded-[8px] p-[16px] border border-border/10">
				<p className="text-inverse text-[14px]">No records found</p>
			</div>
		);
	}

	return (
		<div className="space-y-[12px]">
			{records.map((record, recordIndex) => (
				<div
					key={`record-${recordIndex}-${record.chunkIndex}`}
					className="bg-surface/5 rounded-[8px] p-[12px] space-y-[8px] border border-border/10"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-[8px] flex-wrap">
							<span className="text-[12px] font-semibold text-inverse">
								Chunk #{record.chunkIndex}
							</span>
							{isDocumentResult && record.metadata.documentKey ? (
								<div className="flex flex-col text-[11px] text-inverse">
									<span className="break-all">
										File: {record.metadata.documentKey}
									</span>
								</div>
							) : null}
						</div>
						<ScoreIndicator score={record.score} />
					</div>

					<ContentPreview
						content={record.chunkContent}
						isExpanded={expandedRecords.has(recordIndex)}
						onToggle={() => toggleRecord(recordIndex)}
					/>

					<PRContextDisplay
						metadata={record.metadata}
						additional={record.additional}
					/>

					{Object.keys(record.metadata).length > 0 && (
						<details className="text-[11px] text-inverse">
							<summary className="cursor-pointer hover:text-inverse">
								Metadata
							</summary>
							<div className="mt-[4px] pl-[12px] space-y-[2px]">
								{Object.entries(record.metadata).map(([key, value]) => {
									if (key === "documentVectorStoreSourceDbId") {
										return null;
									}
									return (
										<div key={key} className="flex gap-[8px]">
											<span className="font-medium">{key}:</span>
											<span className="break-all">{String(value)}</span>
										</div>
									);
								})}
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
	const vectorStore = useVectorStore();
	const documentStores = vectorStore?.documentStores ?? [];
	const documentStoreMap = useMemo(() => {
		const map = new Map<string, DocumentVectorStoreSummary>();
		documentStores.forEach((store) => {
			map.set(store.id, store);
		});
		return map;
	}, [documentStores]);

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
			<div className="text-inverse text-[14px] p-[16px] bg-surface/5 rounded-[8px] border border-border/10 text-center">
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
				<p className="text-[12px] text-inverse">
					Found {totalRecords} result{totalRecords !== 1 ? "s" : ""} in{" "}
					{queryResults.length} data source
					{queryResults.length !== 1 ? "s" : ""}
				</p>
			</div>

			{/* Tab Navigation */}
			<div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
				<div className="flex gap-[0px] flex-nowrap">
					{queryResults.map((result, index) => {
						const provider = result.source.provider;
						let descriptor: string = result.source.state.status;
						if (
							provider === "github" &&
							result.source.state.status === "configured"
						) {
							descriptor = `${result.source.state.owner}-${result.source.state.repo}-${result.source.state.contentType}`;
						} else if (
							provider === "document" &&
							result.source.state.status === "configured"
						) {
							descriptor = result.source.state.documentVectorStoreId;
						}

						return (
							<DataSourceTab
								key={`datasource-${index}-${provider}-${descriptor}`}
								result={result}
								isActive={activeTabIndex === index}
								onClick={() => setActiveTabIndex(index)}
								documentStoreMap={documentStoreMap}
							/>
						);
					})}
				</div>
			</div>

			{/* Tab Content */}
			<div>
				{activeResult ? <QueryResultCard result={activeResult} /> : null}
			</div>
		</div>
	);
}

function getGenerationQueryResult(generation: Generation) {
	if (generation.status !== "completed") {
		throw new Error("Generation is not completed");
	}
	const queryResultOutputs = generation.outputs.filter(
		(output) => output.type === "query-result",
	);

	const allResults = [];
	for (const output of queryResultOutputs) {
		if (output.type === "query-result") {
			for (const item of output.content) {
				allResults.push(item);
			}
		}
	}

	return allResults;
}
