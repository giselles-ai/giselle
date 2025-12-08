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
	ChevronRightIcon,
	CircleDashedIcon,
	CircleSlashIcon,
	Copy,
	Download,
	RefreshCw,
	XIcon,
} from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { getAssistantTextFromGeneration } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-text";
import { GenerationView } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { fetchGenerationData } from "../actions";
import { getModelInfo } from "../lib/utils";

interface StepsSectionProps {
	taskPromise: Promise<Task>;
	taskId: TaskId;
}

function StepActions({ generation }: { generation: Generation }) {
	const [copyFeedback, setCopyFeedback] = useState(false);

	const handleCopyToClipboard = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (textContent) {
				await navigator.clipboard.writeText(textContent);
				setCopyFeedback(true);
				setTimeout(() => setCopyFeedback(false), 2000);
			}
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	};

	const handleDownload = (e: React.MouseEvent) => {
		e.stopPropagation();
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
		<>
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
		</>
	);
}

function OutputActions({ generation }: { generation: Generation }) {
	const [copyFeedback, setCopyFeedback] = useState(false);

	const handleCopyToClipboard = async () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (textContent) {
				await navigator.clipboard.writeText(textContent);
				setCopyFeedback(true);
				setTimeout(() => setCopyFeedback(false), 2000);
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
		<div className="flex items-center gap-1">
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
	const stepGenerationsRef = useRef(stepGenerations);
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
	const [isStepsExpanded, setIsStepsExpanded] = useState(true);

	const updateTask = useCallback<StreamDataEventHandler>((data) => {
		setTask(data.task);
	}, []);

	// Keep ref in sync with state
	useEffect(() => {
		stepGenerationsRef.current = stepGenerations;
	}, [stepGenerations]);

	// Fetch generation data for completed steps
	useEffect(() => {
		const fetchGenerations = async () => {
			const generationsToFetch: Array<{
				stepId: string;
				generationId: string;
			}> = [];

			task.sequences.forEach((sequence) => {
				sequence.steps.forEach((step) => {
					if (
						step.status === "completed" &&
						!stepGenerationsRef.current[step.id]
					) {
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

	// Count completed steps
	const completedStepsCount = task.sequences.reduce(
		(count, sequence) =>
			count +
			sequence.steps.filter((step) => step.status === "completed").length,
		0,
	);

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
						className="flex items-center justify-between text-text-muted text-[13px] font-semibold mb-2 w-full cursor-pointer hover:text-text-muted transition-colors"
						onClick={() => setIsStepsExpanded(!isStepsExpanded)}
					>
						<span className="block">Completed {completedStepsCount} steps</span>
						<div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
							<ChevronDownIcon
								className={`size-4 transition-transform ${
									isStepsExpanded ? "rotate-180" : ""
								}`}
							/>
						</div>
					</button>

					{isStepsExpanded && (
						<div className="space-y-4 mb-8">
							{task.sequences.map((sequence, sequenceIndex) => (
								<div key={sequence.id} className="space-y-2">
									{/* Step Heading */}
									<div className="text-[14px] font-medium text-[hsl(192,73%,84%)]">
										Step {sequenceIndex + 1}
									</div>
									{/* Steps - stacked vertically in a single column */}
									<div className="flex flex-col gap-2">
										{sequence.steps.map((step) => {
											const isExpanded = expandedSteps.has(step.id);
											const generation = stepGenerations[step.id];
											const modelInfo = getModelInfo(generation);

											return (
												<div key={step.id} className="space-y-2">
													{/* Step Button */}
													<div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-transparent hover:bg-white/5 transition-colors">
														<button
															type="button"
															className="flex-1 flex items-center gap-3 text-left"
															onClick={() => handleStepToggle(step.id)}
														>
															{/* Step Status Icon */}
															<div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
																{step.status === "queued" && (
																	<CircleDashedIcon className="text-black size-[16px]" />
																)}
																{step.status === "running" && (
																	<RefreshCw className="text-black size-[16px] animate-spin" />
																)}
																{step.status === "completed" &&
																	(() => {
																		if (generation) {
																			return (
																				<NodeIcon
																					node={
																						generation.context.operationNode
																					}
																					className="size-[16px] text-black"
																				/>
																			);
																		}
																		return (
																			<BrainCircuit className="text-black size-[16px]" />
																		);
																	})()}
																{step.status === "failed" && (
																	<XIcon className="text-black size-[16px]" />
																)}
																{step.status === "cancelled" && (
																	<CircleSlashIcon className="text-black size-[16px]" />
																)}
															</div>
															<span className="text-[14px] text-text-muted">
																{step.name || "Untitled"}
															</span>
															{step.status === "completed" && generation && (
																<span className="text-[12px] text-text-muted">
																	{modelInfo.modelName}
																</span>
															)}
														</button>
														<div className="flex items-center gap-2">
															{step.status === "completed" && generation && (
																<StepActions generation={generation} />
															)}
															<ChevronRightIcon
																className={`size-4 text-text-muted transition-transform ${
																	isExpanded ? "rotate-90" : ""
																}`}
															/>
														</div>
													</div>

													{/* Step Content Accordion */}
													{isExpanded && generation && (
														<div className="ml-4 pl-4 border-l-2 border-border">
															<div className="py-4">
																<GenerationView generation={generation} />
															</div>
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					)}

					{/* Output preview for last completed step */}
					<div className="mt-4">
						<div className="flex items-center justify-between text-text-muted text-[13px] font-semibold mb-2 w-full">
							<span className="block">Output</span>
							{lastCompletedGeneration && (
								<OutputActions generation={lastCompletedGeneration} />
							)}
						</div>
						<div className="ml-0">
							{lastCompletedGeneration ? (
								<GenerationView generation={lastCompletedGeneration} />
							) : (
								<p className="text-[13px] text-text-muted/70 italic">
									No output available yet.
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</TaskStreamReader>
	);
}
