"use client";

import { NodeIcon } from "@giselle-internal/workflow-designer-ui";
import type { Generation, Task, TaskId } from "@giselles-ai/protocol";
import {
	type StreamDataEventHandler,
	TaskStreamReader,
} from "@giselles-ai/react";
import {
	BrainCircuit,
	CheckCircle,
	ChevronDownIcon,
	CircleDashedIcon,
	CircleSlashIcon,
	Copy,
	Download,
	RefreshCw,
	XIcon,
} from "lucide-react";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAssistantTextFromGeneration } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-text";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { fetchGenerationData } from "../actions";
import { getModelInfo } from "../lib/utils";
import { RunInStudioOnlyChip } from "./run-in-studio-only-chip";
import { StepErrorState } from "./step-error-state";

interface StepsSectionProps {
	taskPromise: Promise<Task>;
	taskId: TaskId;
}

const iconClassName =
	"text-text-muted/70 group-hover:text-text-muted size-[16px] flex-shrink-0 transition-colors";

function StepStatusIcon({
	status,
	operationNode,
}: {
	status: string;
	operationNode?: Generation["context"]["operationNode"];
}) {
	if (status === "queued") {
		return <CircleDashedIcon className={iconClassName} />;
	}
	if (status === "running") {
		return <RefreshCw className={`${iconClassName} animate-spin`} />;
	}
	if (status === "completed") {
		if (operationNode) {
			return <NodeIcon node={operationNode} className={iconClassName} />;
		}
		return <BrainCircuit className={iconClassName} />;
	}
	if (status === "failed") {
		return (
			<XIcon className="text-red-400 size-[16px] flex-shrink-0 transition-colors" />
		);
	}
	if (status === "cancelled") {
		return <CircleSlashIcon className={iconClassName} />;
	}
	return null;
}

function OutputActions({ generation }: { generation: Generation }) {
	const [copyFeedback, setCopyFeedback] = useState(false);

	// Cleanup timeout when copyFeedback changes or component unmounts
	useEffect(() => {
		if (copyFeedback) {
			const timer = setTimeout(() => setCopyFeedback(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [copyFeedback]);

	const handleCopyToClipboard = async () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (textContent) {
				await navigator.clipboard.writeText(textContent);
				setCopyFeedback(true);
			}
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	};

	const handleDownload = () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (textContent) {
				const blob = new Blob([textContent], { type: "text/plain" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `generation-${generation.id}.txt`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error("Failed to download content:", error);
		}
	};

	return (
		<div className="flex items-center">
			<button
				type="button"
				className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
				title={copyFeedback ? "Copied!" : "Copy content"}
				onClick={handleCopyToClipboard}
			>
				{copyFeedback ? (
					<CheckCircle className="size-4 text-green-400" />
				) : (
					<Copy className="size-4 text-text-muted group-hover:text-text transition-colors" />
				)}
			</button>
			<button
				type="button"
				className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
				title="Download content"
				onClick={handleDownload}
			>
				<Download className="size-4 text-text-muted group-hover:text-text transition-colors" />
			</button>
		</div>
	);
}

export function StepsSection({ taskPromise, taskId }: StepsSectionProps) {
	const defaultTask = use(taskPromise);
	const [task, setTask] = useState(defaultTask);
	const [stepGenerations, setStepGenerations] = useState<
		Record<string, Generation>
	>({});
	const [stepOperationNodes, setStepOperationNodes] = useState<
		Record<string, Generation["context"]["operationNode"]>
	>({});
	const stepGenerationsRef = useRef(stepGenerations);
	const stepOperationNodesRef = useRef(stepOperationNodes);
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
	const [isStepsExpanded, setIsStepsExpanded] = useState(false);
	const [isOutputExpanded, setIsOutputExpanded] = useState(true);

	const updateTask = useCallback<StreamDataEventHandler>((data) => {
		setTask(data.task);
	}, []);

	// Fetch generation data for completed steps
	useEffect(() => {
		const fetchGenerations = async () => {
			const generationsToFetch: Array<{
				stepId: string;
				generationId: string;
			}> = [];

			task.sequences.forEach((sequence) => {
				sequence.steps.forEach((step) => {
					// Fetch generation for completed steps, or fetch operationNode for any step that doesn't have it yet
					if (
						step.status === "completed" &&
						!stepGenerationsRef.current[step.id]
					) {
						generationsToFetch.push({
							stepId: step.id,
							generationId: step.generationId,
						});
					} else if (
						!stepOperationNodesRef.current[step.id] &&
						step.generationId
					) {
						// Fetch generation just to get operationNode, even if step is not completed
						generationsToFetch.push({
							stepId: step.id,
							generationId: step.generationId,
						});
					}
				});
			});

			for (const { stepId, generationId } of generationsToFetch) {
				try {
					const generation = await fetchGenerationData(generationId);
					if (generation) {
						setStepGenerations((prev) => {
							const updated = {
								...prev,
								[stepId]: generation,
							};
							// Update ref immediately for use in async operations
							stepGenerationsRef.current = updated;
							return updated;
						});
						// Save operationNode even if generation has no output
						if (generation.context.operationNode) {
							setStepOperationNodes((prev) => {
								const updated = {
									...prev,
									[stepId]: generation.context.operationNode,
								};
								// Update ref immediately for use in async operations
								stepOperationNodesRef.current = updated;
								return updated;
							});
						}
					}
				} catch (error) {
					console.warn(`Failed to fetch generation for step ${stepId}:`, error);
				}
			}
		};

		fetchGenerations().catch((error) => {
			console.error("Failed to fetch generations:", error);
		});
	}, [task]);

	// Count total, completed, and preparing steps
	const { totalStepsCount, completedStepsCount, preparingStepsCount } =
		task.sequences.reduce(
			(counts, sequence) => {
				const sequenceTotal = sequence.steps.length;
				const sequenceCompleted = sequence.steps.filter(
					(step) => step.status === "completed",
				).length;
				const sequencePreparing = sequence.steps.filter(
					(step) => step.status === "queued",
				).length;
				return {
					totalStepsCount: counts.totalStepsCount + sequenceTotal,
					completedStepsCount: counts.completedStepsCount + sequenceCompleted,
					preparingStepsCount: counts.preparingStepsCount + sequencePreparing,
				};
			},
			{
				totalStepsCount: 0,
				completedStepsCount: 0,
				preparingStepsCount: 0,
			},
		);

	// Find the first running step's sequence number
	const runningStepNumber = useMemo(() => {
		for (
			let sequenceIndex = 0;
			sequenceIndex < task.sequences.length;
			sequenceIndex++
		) {
			const sequence = task.sequences[sequenceIndex];
			const hasRunningStep = sequence.steps.some(
				(step) => step.status === "running",
			);
			if (hasRunningStep) {
				return sequenceIndex + 1;
			}
		}
		return null;
	}, [task.sequences]);

	// Determine status text based on current step states (priority: Running > Preparing > Completed)
	const statusText = useMemo(() => {
		if (runningStepNumber !== null) {
			return `Running Step ${runningStepNumber}`;
		}
		if (preparingStepsCount > 0) {
			return `Preparing ${preparingStepsCount} step${preparingStepsCount !== 1 ? "s" : ""}`;
		}
		return `Completed ${completedStepsCount} step${completedStepsCount !== 1 ? "s" : ""}`;
	}, [runningStepNumber, preparingStepsCount, completedStepsCount]);

	const progressRatio =
		totalStepsCount > 0 ? completedStepsCount / totalStepsCount : 0;

	// Find the last completed step's generation (if available)
	const lastCompletedGeneration = useMemo(() => {
		for (
			let sequenceIndex = task.sequences.length - 1;
			sequenceIndex >= 0;
			sequenceIndex--
		) {
			const sequence = task.sequences[sequenceIndex];
			for (
				let stepIndex = sequence.steps.length - 1;
				stepIndex >= 0;
				stepIndex--
			) {
				const step = sequence.steps[stepIndex];
				if (step.status === "completed") {
					const generation = stepGenerations[step.id];
					if (generation) {
						return generation;
					}
				}
			}
		}
		return undefined;
	}, [task.sequences, stepGenerations]);

	// Auto-expand output when a new step completes
	// This is a side effect that should happen when lastCompletedGeneration changes,
	// not during render, so useEffect is necessary here
	useEffect(() => {
		if (lastCompletedGeneration) {
			setIsOutputExpanded(true);
		}
	}, [lastCompletedGeneration]);

	const handleStepToggle = (stepId: string) => {
		setExpandedSteps((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(stepId)) {
				newSet.delete(stepId);
			} else {
				newSet.add(stepId);
			}
			return newSet;
		});
	};

	return (
		<TaskStreamReader taskId={taskId} onUpdateAction={updateTask}>
			<div className="w-full mt-6">
				{/* Steps Header */}
				<button
					type="button"
					className="flex items-center gap-2 text-text-muted text-[13px] font-semibold mb-4 py-2 w-full cursor-pointer hover:text-text-muted transition-colors"
					onClick={() => setIsStepsExpanded(!isStepsExpanded)}
				>
					<div className="flex items-center gap-2">
						<span className="block">{statusText}</span>
						{totalStepsCount > 0 ? (
							<div className="flex items-center gap-1 text-[11px] text-text-muted/80">
								<div
									className="relative h-[6px] w-16 overflow-hidden rounded-full bg-white/5"
									aria-hidden="true"
								>
									<div
										className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(131,157,195,1),rgba(129,140,248,1))] transition-[width] duration-500 ease-out"
										style={{
											width: `${
												Math.min(Math.max(progressRatio, 0), 1) * 100
											}%`,
										}}
									/>
								</div>
								<span className="tabular-nums">
									{completedStepsCount}/{totalStepsCount}
								</span>
							</div>
						) : null}
					</div>
					<div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
						<ChevronDownIcon
							className={`size-4 transition-transform ${
								isStepsExpanded ? "rotate-180" : ""
							}`}
						/>
					</div>
				</button>

				{isStepsExpanded && (
					<div className="mb-8 border-l border-border pl-3">
						{task.sequences.map((sequence, sequenceIndex) => {
							// Determine sequence status
							const hasRunningStep = sequence.steps.some(
								(step) => step.status === "running",
							);
							const allStepsCompleted = sequence.steps.every(
								(step) => step.status === "completed",
							);
							const sequenceStatus = allStepsCompleted
								? "completed"
								: hasRunningStep
									? "running"
									: "pending";

							return (
								<div
									key={sequence.id}
									className={`grid grid-cols-[72px_540px] items-start gap-3 ${
										sequenceIndex > 0 ? "mt-4" : ""
									}`}
								>
									{/* Step Heading (left column, single label per sequence) */}
									<span
										className={`text-[13px] font-medium ${
											sequenceStatus === "completed"
												? "text-[hsl(192,73%,84%)]/70"
												: sequenceStatus === "running"
													? "text-text-muted/50 bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[hsl(192,73%,84%)] via-[hsl(192,73%,84%)_50%] to-[hsl(192,73%,84%)] text-transparent animate-shimmer"
													: "text-text-muted/50"
										}`}
									>
										Step {sequenceIndex + 1}
									</span>

									{/* Step cards + accordions (right column, all steps stacked vertically) */}
									<div className="space-y-2">
										{sequence.steps.map((step) => {
											const generation = stepGenerations[step.id];
											// Check if generation exists and is completed
											// Allow expansion if generation is completed, even if there's no text output
											// (e.g., generation nodes may have other output types)
											const hasOutput =
												generation && generation.status === "completed";
											// Only allow expansion if generation exists and is completed
											const isExpanded =
												hasOutput && expandedSteps.has(step.id);
											const operationNode =
												generation?.context.operationNode ??
												stepOperationNodes[step.id];
											const modelInfo = getModelInfo(generation);

											return (
												<div key={step.id}>
													<div className="group flex items-center gap-3 rounded-lg bg-transparent transition-colors">
														<button
															type="button"
															className={`flex-1 flex items-center gap-3 text-left ${
																!hasOutput ? "cursor-default" : ""
															}`}
															onClick={() => {
																// Only toggle if generation exists and has output
																if (hasOutput) {
																	handleStepToggle(step.id);
																}
															}}
															disabled={!hasOutput}
														>
															<StepStatusIcon
																status={step.status}
																operationNode={operationNode}
															/>
															<span className="text-[13px] text-text-muted/70 group-hover:text-text-muted transition-colors">
																{step.name || "Untitled"}
															</span>
															{step.status === "completed" && generation && (
																<span className="text-[13px] text-text-muted/70 group-hover:text-text-muted transition-colors">
																	{modelInfo.modelName}
																</span>
															)}
														</button>
														{/* Layer 2: Run in Studio Only Chip (only for failed steps) */}
														{step.status === "failed" && (
															<RunInStudioOnlyChip />
														)}
													</div>

													{/* Layer 3: Step Error State */}
													{step.status === "failed" && (
														<StepErrorState
															workspaceId={task.workspaceId}
															stepId={step.id}
														/>
													)}

													{/* Step Content Accordion */}
													{isExpanded && hasOutput && generation && (
														<div className="ml-4 pl-4 border-l-2 border-border">
															<div className="py-4 [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
																<GenerationView generation={generation} />
															</div>
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Output preview for last completed step */}
				<div className="mt-4">
					<div className="flex items-center justify-between text-text-muted text-[13px] font-semibold mb-2 w-full">
						<span className="block">Output from last completed step</span>
					</div>
					{task.status === "inProgress" || task.status === "failed" ? (
						<p className="text-[13px] text-text-muted/70 italic">
							{task.status === "inProgress" ? (
								<span
									className="bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-text-muted/70 via-text-muted/35 to-text-muted/70 text-transparent animate-shimmer"
									style={{
										animationDuration: "1s",
										animationTimingFunction: "linear",
									}}
								>
									Please wait, executing...
								</span>
							) : (
								"No output available."
							)}
						</p>
					) : lastCompletedGeneration ? (
						<div className="rounded-xl bg-blue-muted/5 px-4 py-3">
							<div className="flex items-center justify-between mb-2 w-full">
								<div className="flex-1" />
								<div className="flex items-center">
									<OutputActions generation={lastCompletedGeneration} />
									<button
										type="button"
										className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
										onClick={() => setIsOutputExpanded(!isOutputExpanded)}
										aria-label={
											isOutputExpanded ? "Collapse output" : "Expand output"
										}
									>
										<ChevronDownIcon
											className={`size-4 text-text-muted transition-transform ${
												isOutputExpanded ? "rotate-180" : ""
											}`}
										/>
									</button>
								</div>
							</div>
							{isOutputExpanded ? (
								<div className="mt-1 [&_.markdown-renderer]:text-[14px]">
									<GenerationView generation={lastCompletedGeneration} />
								</div>
							) : null}
						</div>
					) : (
						<p className="text-[13px] text-text-muted/70 italic">
							No output available yet.
						</p>
					)}
				</div>
			</div>
		</TaskStreamReader>
	);
}
