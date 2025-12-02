"use client";

import { NodeIcon } from "@giselle-internal/workflow-designer-ui";
import type { Generation, Task } from "@giselles-ai/protocol";
import {
	type StreamDataEventHandler,
	TaskStreamReader,
} from "@giselles-ai/react";
import {
	BrainCircuit,
	ChevronDownIcon,
	ChevronRightIcon,
	CircleDashedIcon,
	CircleSlashIcon,
	RefreshCw,
	XIcon,
} from "lucide-react";
import { use, useCallback, useEffect, useState } from "react";
import { GenerationView } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { fetchGenerationData } from "../actions";
import { getModelInfo } from "../lib/utils";

interface StepsSectionProps {
	taskPromise: Promise<Task>;
	taskId: string;
}

export function StepsSection({ taskPromise, taskId }: StepsSectionProps) {
	const defaultTask = use(taskPromise);
	const [task, setTask] = useState(defaultTask);
	const [stepGenerations, setStepGenerations] = useState<
		Record<string, Generation>
	>({});
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
	const [isStepsExpanded, setIsStepsExpanded] = useState(true);
	const [hasInitialized, setHasInitialized] = useState(false);

	const updateTask = useCallback<StreamDataEventHandler>((data) => {
		setTask(data.task);
	}, []);

	// Find the last completed step to open by default (only on initial load)
	useEffect(() => {
		if (hasInitialized) return;

		let lastCompletedStepId: string | undefined;
		// Iterate through sequences and steps to find the last completed step
		for (const sequence of task.sequences) {
			for (const step of sequence.steps) {
				if (step.status === "completed") {
					lastCompletedStepId = step.id;
				}
			}
		}
		// Set the last completed step as expanded by default
		if (lastCompletedStepId) {
			setExpandedSteps(new Set([lastCompletedStepId]));
		}
		setHasInitialized(true);
	}, [task, hasInitialized]);

	// Fetch generation data for completed steps
	useEffect(() => {
		const fetchGenerations = async () => {
			const generationsToFetch: Array<{
				stepId: string;
				generationId: string;
			}> = [];

			task.sequences.forEach((sequence) => {
				sequence.steps.forEach((step) => {
					if (step.status === "completed" && !stepGenerations[step.id]) {
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

		fetchGenerations();
	}, [task, stepGenerations]);

	// Count completed steps
	const completedStepsCount = task.sequences.reduce(
		(count, sequence) =>
			count +
			sequence.steps.filter((step) => step.status === "completed").length,
		0,
	);

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
					className="flex items-center justify-between text-[16px] font-medium text-text mb-4 w-full cursor-pointer hover:text-text transition-colors"
					onClick={() => setIsStepsExpanded(!isStepsExpanded)}
				>
					<span>Completed {completedStepsCount} steps</span>
					<ChevronDownIcon
						className={`size-5 transition-transform ${
							isStepsExpanded ? "rotate-180" : ""
						}`}
					/>
				</button>

				{isStepsExpanded && (
					<div className="space-y-3">
						{task.sequences.map((sequence, sequenceIndex) => (
							<div key={sequence.id} className="space-y-2">
								{sequence.steps.map((step) => {
									const isExpanded = expandedSteps.has(step.id);
									const generation = stepGenerations[step.id];
									const modelInfo = getModelInfo(generation);

									return (
										<div key={step.id} className="space-y-2">
											{/* Step Button */}
											<div className="flex items-center gap-3">
												<button
													type="button"
													className="flex-1 flex items-center justify-between p-3 rounded-lg border border-border bg-transparent hover:bg-white/5 transition-colors text-left"
													onClick={() => handleStepToggle(step.id)}
												>
													<div className="flex items-center gap-3">
														<span className="text-[14px] font-medium text-text">
															Step {sequenceIndex + 1}
														</span>
														<span className="text-[14px] text-text-muted">
															{step.name || "Untitled"}
														</span>
													</div>
													<div className="flex items-center gap-2">
														{step.status === "completed" && generation && (
															<span className="text-[12px] text-text-muted">
																{modelInfo.modelName}
															</span>
														)}
														<ChevronRightIcon
															className={`size-4 text-text-muted transition-transform ${
																isExpanded ? "rotate-90" : ""
															}`}
														/>
													</div>
												</button>

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
																		node={generation.context.operationNode}
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
						))}
					</div>
				)}
			</div>
		</TaskStreamReader>
	);
}
