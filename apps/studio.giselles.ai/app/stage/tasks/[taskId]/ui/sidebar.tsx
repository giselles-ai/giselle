"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { NodeIcon } from "@giselle-internal/workflow-designer-ui";
import type { AppParameter, Generation, Task } from "@giselles-ai/protocol";
import {
	type StreamDataEventHandler,
	TaskStreamReader,
} from "@giselles-ai/react";
import {
	BrainCircuit,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronUpIcon,
	CircleDashedIcon,
	CircleSlashIcon,
	RefreshCw,
	XIcon,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { use, useCallback, useEffect, useState } from "react";
import { GenerationView } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { fetchGenerationData } from "../actions";
import {
	formatExecutionDate,
	getModelInfo,
	getStatusBadgeStatus,
} from "../lib/utils";
import { MobileActions } from "./mobile-actions";

export interface SidebarDataObject {
	task: Task;
	appName: string;
	teamName: string;
	appParameters: AppParameter[];
	iconName: string;
}

type DynamicIconName = React.ComponentProps<typeof DynamicIcon>["name"];

interface GenerationInputItem {
	name: string;
	value: unknown;
}

interface GenerationInputGroup {
	type: string;
	items?: GenerationInputItem[];
}

export function Sidebar({ data }: { data: Promise<SidebarDataObject> }) {
	const {
		task: defaultTask,
		appName,
		teamName,
		appParameters: triggerParameters,
		iconName,
	} = use(data);
	const [task, setTask] = useState(defaultTask);
	const [stepGenerations, setStepGenerations] = useState<
		Record<string, Generation>
	>({});
	const [hasMounted, setHasMounted] = useState(false);
	const [isInputsExpanded, setIsInputsExpanded] = useState(false);
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
	const router = useRouter();
	const pathname = usePathname();

	const updateTask = useCallback<StreamDataEventHandler>((data) => {
		setTask(data.task);
	}, []);

	// Fetch generation data for completed steps and trigger step
	useEffect(() => {
		const fetchGenerations = async () => {
			const generationsToFetch: Array<{
				stepId: string;
				generationId: string;
			}> = [];

			// Collect all completed steps that need generation data, including trigger step
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

			// Fetch generation data for each step using giselle
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

	// Track when component has mounted to prevent hydration mismatch
	useEffect(() => {
		setHasMounted(true);
	}, []);

	// On desktop, when visiting /stage/tasks/[taskId] without a stepId,
	// automatically navigate to the first completed step that has generation data.
	useEffect(() => {
		if (!hasMounted) {
			return;
		}

		if (typeof window === "undefined") {
			return;
		}

		// Only auto-select on desktop layout; mobile uses in-place accordion instead.
		if (window.innerWidth < 768) {
			return;
		}

		// If URL already includes a stepId, do nothing.
		const segments = pathname.split("/").filter(Boolean);
		// /stage/tasks/[taskId] → ["stage", "tasks", "{taskId}"]
		// /stage/tasks/[taskId]/[stepId] → ["stage", "tasks", "{taskId}", "{stepId}"]
		if (segments.length >= 4) {
			return;
		}

		for (const sequence of task.sequences) {
			for (const step of sequence.steps) {
				const generation = stepGenerations[step.id];
				if (!generation) {
					continue;
				}

				router.replace(`/stage/tasks/${task.id}/${step.id}`);
				return;
			}
		}
	}, [hasMounted, pathname, router, stepGenerations, task]);

	return (
		<TaskStreamReader taskId={defaultTask.id} onUpdateAction={updateTask}>
			<aside className="w-full md:flex md:flex-col md:w-[280px] border-0 md:border-[2px] md:border-transparent m-0 md:my-[8px] pb-20 md:pb-0">
				{/* Large Back Arrow */}
				<div className="pt-[16px] mb-0 px-[8px] md:px-[12px]">
					<Link
						href="/stage/tasks"
						className="flex items-center gap-[8px] text-inverse hover:text-white-700 transition-colors group"
					>
						<ChevronLeftIcon className="size-[24px] group-hover:-translate-x-1 transition-transform" />
						<span className="text-[16px] font-medium">Back to Tasks</span>
					</Link>
				</div>

				{/* App Info Section */}
				<div className="space-y-[16px] px-[8px] md:px-[12px] text-center md:text-left mt-[20px]">
					{/* App Thumbnail */}
					<div className="relative flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all bg-card/60 border-[hsl(192,73%,84%)] mx-auto md:mx-0">
						<DynamicIcon
							name={iconName as DynamicIconName}
							className="relative z-[1] h-6 w-6 stroke-1 text-[hsl(192,73%,84%)]"
						/>
					</div>

					{/* App Name */}
					<div>
						<h1 className="text-[24px] font-semibold text-inverse mb-[4px]">
							{appName}
						</h1>
						<p className="text-[14px] text-inverse">{teamName}</p>
					</div>

					{/* Execution Time */}
					<div className="mt-[16px]">
						<div className="flex items-center justify-center md:justify-start gap-2 text-[11px]">
							<span className="text-white/50">
								{formatExecutionDate(task.createdAt)}
							</span>
							<StatusBadge
								status={getStatusBadgeStatus(task.status)}
								variant="dot"
							>
								{task.status || "Unknown"}
							</StatusBadge>
						</div>
					</div>

					{/* Input Values Section */}
					{hasMounted &&
						task.sequences[0]?.steps[0] &&
						(() => {
							const triggerStep = task.sequences[0].steps[0];
							const triggerGeneration = stepGenerations[triggerStep.id];
							const parametersInput = triggerGeneration?.context?.inputs?.find(
								(input: GenerationInputGroup) => input.type === "parameters",
							);
							const inputs =
								parametersInput && "items" in parametersInput
									? parametersInput.items
									: [];

							return inputs.length > 0 ? (
								<div className="mt-[24px] mb-[24px]">
									<button
										type="button"
										className="flex items-center justify-between text-[12px] font-medium text-inverse/60 mb-3 w-full cursor-pointer hover:text-inverse/80 transition-colors"
										onClick={() => setIsInputsExpanded(!isInputsExpanded)}
									>
										<span>Input parameter</span>
										<ChevronDownIcon
											className={`size-[16px] transition-transform ${
												isInputsExpanded ? "rotate-180" : ""
											}`}
										/>
									</button>
									{isInputsExpanded && (
										<div className="space-y-2">
											{inputs.map((input: GenerationInputItem) => {
												// Find the corresponding parameter definition for user-friendly label
												const parameter = triggerParameters.find(
													(param) => param.id === input.name,
												);

												return (
													<div
														key={`${input.name}-${input.value}`}
														className="bg-white/5 rounded-[8px] p-3"
													>
														<div className="text-[11px] text-inverse/80">
															{parameter?.name && (
																<div className="text-white/50 mb-1">
																	{parameter.name}
																</div>
															)}
															<div className="text-white/70">
																{String(input.value)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							) : null;
						})()}
				</div>

				{/* Steps Section */}
				<div className="space-y-4 pb-4 px-[8px] md:px-[12px] md:flex-1 md:overflow-y-auto md:min-h-0">
					{task.sequences.map((sequence, sequenceIndex) => (
						<div key={sequence.id} className="space-y-3">
							{/* Step Header */}
							<div className="text-[12px] font-medium text-inverse/60 mb-2">
								Step {sequenceIndex + 1}
							</div>

							{/* Step Cards */}
							<div className="space-y-2">
								{sequence.steps.map((step) => {
									const isExpanded = expandedSteps.has(step.id);
									const generation = stepGenerations[step.id];
									const pathSegments = pathname.split("/").filter(Boolean);
									const currentStepId =
										pathSegments.length >= 4 ? pathSegments[3] : undefined;
									const isActive = currentStepId === step.id;

									const handleStepClick = (e: React.MouseEvent) => {
										// モバイルの場合はアコーディオン開閉
										if (window.innerWidth < 768) {
											e.preventDefault();
											setExpandedSteps((prev) => {
												const newSet = new Set(prev);
												if (newSet.has(step.id)) {
													newSet.delete(step.id);
												} else {
													newSet.add(step.id);
												}
												return newSet;
											});
										}
										// デスクトップの場合はページ遷移（Linkのデフォルト動作）
									};

									return (
										<div key={step.id}>
											<Link
												href={`/stage/tasks/${task.id}/${step.id}`}
												className="block group"
												onClick={handleStepClick}
											>
												<div
													className={`flex w-full p-2 justify-between items-center rounded-[8px] border bg-transparent hover:bg-white/5 transition-colors ${
														isActive ? "border-white" : "border-white/20"
													}`}
												>
													<div className="flex items-center gap-3">
														{/* Step Icon */}
														<div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center flex-shrink-0">
															{step.status === "queued" && (
																<CircleDashedIcon className="text-black size-[16px]" />
															)}
															{step.status === "running" && (
																<RefreshCw className="text-black size-[16px]" />
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

														{/* Step Info */}
														<div className="flex-1 min-w-0">
															<div className="text-white font-bold text-[12px]">
																{step.name || "Untitled"}
															</div>
															<div
																className="flex items-center gap-1 text-[10px] font-medium leading-[1.4]"
																style={{ color: "#505D7B" }}
															>
																{step.status === "completed" &&
																	(() => {
																		const modelInfo = getModelInfo(generation);
																		return <span>{modelInfo.modelName}</span>;
																	})()}
																{step.status === "running" && "Running"}
																{step.status === "failed" && "Failed"}
																{step.status === "queued" && "Queued"}
																{step.status === "cancelled" && "Cancelled"}
															</div>
														</div>
													</div>

													{/* Mobile Accordion Arrow */}
													<div className="block md:hidden ml-2">
														{isExpanded ? (
															<ChevronUpIcon className="size-4 text-white/60" />
														) : (
															<ChevronDownIcon className="size-4 text-white/60" />
														)}
													</div>
												</div>
											</Link>

											{/* Mobile Accordion Content */}
											{isExpanded && generation && (
												<div className="block md:hidden mt-2 bg-white/5 rounded-lg p-4 border border-border">
													<GenerationView generation={generation} />
													<MobileActions generation={generation} />
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</aside>
		</TaskStreamReader>
	);
}
