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
import { use, useCallback, useEffect, useRef, useState } from "react";
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

	// Keep refs in sync with state
	useEffect(() => {
		stepGenerationsRef.current = stepGenerations;
	}, [stepGenerations]);

	useEffect(() => {
		stepOperationNodesRef.current = stepOperationNodes;
	}, [stepOperationNodes]);

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
						setStepGenerations((prev) => ({
							...prev,
							[stepId]: generation,
						}));
						// Save operationNode even if generation has no output
						if (generation.context.operationNode) {
							setStepOperationNodes((prev) => ({
								...prev,
								[stepId]: generation.context.operationNode,
							}));
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

	// Count total, completed, running, and preparing steps
	const {
		totalStepsCount,
		completedStepsCount,
		runningStepsCount,
		preparingStepsCount,
	} = task.sequences.reduce(
		(counts, sequence) => {
			const sequenceTotal = sequence.steps.length;
			const sequenceCompleted = sequence.steps.filter(
				(step) => step.status === "completed",
			).length;
			const sequenceRunning = sequence.steps.filter(
				(step) => step.status === "running",
			).length;
			const sequencePreparing = sequence.steps.filter(
				(step) => step.status === "queued",
			).length;
			return {
				totalStepsCount: counts.totalStepsCount + sequenceTotal,
				completedStepsCount: counts.completedStepsCount + sequenceCompleted,
				runningStepsCount: counts.runningStepsCount + sequenceRunning,
				preparingStepsCount: counts.preparingStepsCount + sequencePreparing,
			};
		},
		{
			totalStepsCount: 0,
			completedStepsCount: 0,
			runningStepsCount: 0,
			preparingStepsCount: 0,
		},
	);

	// Determine status text based on current step states (priority: Running > Preparing > Completed)
	const getStatusText = () => {
		if (runningStepsCount > 0) {
			return `Running ${runningStepsCount} step${runningStepsCount !== 1 ? "s" : ""}`;
		}
		if (preparingStepsCount > 0) {
			return `Preparing ${preparingStepsCount} step${preparingStepsCount !== 1 ? "s" : ""}`;
		}
		return `Completed ${completedStepsCount} step${completedStepsCount !== 1 ? "s" : ""}`;
	};

	const statusText = getStatusText();
	const isActive = runningStepsCount > 0 || preparingStepsCount > 0;

	const progressRatio =
		totalStepsCount > 0 ? completedStepsCount / totalStepsCount : 0;

	// Find the last completed step's generation (if available)
	const lastCompletedGeneration = (() => {
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
	})();

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
				<div className="max-w-[640px] min-w-[320px] mx-auto">
					{/* Steps Header */}
					<button
						type="button"
						className="flex items-center gap-2 text-text-muted text-[13px] font-semibold mb-4 py-2 w-full cursor-pointer hover:text-text-muted transition-colors"
						onClick={() => setIsStepsExpanded(!isStepsExpanded)}
					>
						<div className="flex items-center gap-2">
							{isActive ? (
								<span
									className="block bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-text-muted via-text-muted/50 to-text-muted text-transparent animate-shimmer"
									style={{
										animationDuration: "1s",
										animationTimingFunction: "linear",
									}}
								>
									{statusText}
								</span>
							) : (
								<span className="block">{statusText}</span>
							)}
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
												// Check if generation has actual output content
												const hasOutput =
													generation &&
													generation.status === "completed" &&
													(() => {
														const textContent =
															getAssistantTextFromGeneration(generation);
														return textContent && textContent.trim().length > 0;
													})();
												// Only allow expansion if generation exists and has output
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
																{/* Step Status Icon */}
																{step.status === "queued" && (
																	<CircleDashedIcon className="text-text-muted/70 group-hover:text-text-muted size-[16px] flex-shrink-0 transition-colors" />
																)}
																{step.status === "running" && (
																	<RefreshCw className="text-text-muted/70 group-hover:text-text-muted size-[16px] animate-spin flex-shrink-0 transition-colors" />
																)}
																{step.status === "completed" &&
																	(() => {
																		if (operationNode) {
																			return (
																				<NodeIcon
																					node={operationNode}
																					className="size-[16px] text-text-muted/70 group-hover:text-text-muted flex-shrink-0 transition-colors"
																				/>
																			);
																		}
																		return (
																			<BrainCircuit className="text-text-muted/70 group-hover:text-text-muted size-[16px] flex-shrink-0 transition-colors" />
																		);
																	})()}
																{step.status === "failed" && (
																	<XIcon className="text-red-400 size-[16px] flex-shrink-0 transition-colors" />
																)}
																{step.status === "cancelled" && (
																	<CircleSlashIcon className="text-text-muted/70 group-hover:text-text-muted size-[16px] flex-shrink-0 transition-colors" />
																)}
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
								{task.status === "inProgress"
									? "Please wait, executing..."
									: "No output available."}
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
			</div>
		</TaskStreamReader>
	);
}
