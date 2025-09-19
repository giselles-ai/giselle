"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { NodeIcon } from "@giselle-internal/workflow-designer-ui";
import type { ManualTriggerParameter } from "@giselle-sdk/data-type";
import type { Generation } from "@giselle-sdk/giselle";
import {
	type Act,
	ActStreamReader,
	type StreamDataEventHandler,
} from "@giselle-sdk/giselle/react";
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
import Link from "next/link";
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
	act: Act;
	appName: string;
	teamName: string;
	triggerParameters: ManualTriggerParameter[];
}

export function Sidebar({ data }: { data: Promise<SidebarDataObject> }) {
	const { act: defaultAct, appName, teamName, triggerParameters } = use(data);
	const [act, setAct] = useState(defaultAct);
	const [stepGenerations, setStepGenerations] = useState<
		Record<string, Generation>
	>({});
	const [hasMounted, setHasMounted] = useState(false);
	const [isInputsExpanded, setIsInputsExpanded] = useState(false);
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

	const updateAct = useCallback<StreamDataEventHandler>((data) => {
		setAct(data.act);
	}, []);

	// Fetch generation data for completed steps and trigger step
	useEffect(() => {
		const fetchGenerations = async () => {
			const generationsToFetch: Array<{
				stepId: string;
				generationId: string;
			}> = [];

			// Collect all completed steps that need generation data, including trigger step
			act.sequences.forEach((sequence) => {
				sequence.steps.forEach((step) => {
					if (step.status === "completed" && !stepGenerations[step.id]) {
						generationsToFetch.push({
							stepId: step.id,
							generationId: step.generationId,
						});
					}
				});
			});

			// Fetch generation data for each step using giselleEngine
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
	}, [act, stepGenerations]);

	// Track when component has mounted to prevent hydration mismatch
	useEffect(() => {
		setHasMounted(true);
	}, []);

	return (
		<ActStreamReader actId={defaultAct.id} onUpdateAction={updateAct}>
			<aside className="w-full md:flex md:flex-col md:w-[320px] border-0 md:border-[2px] md:border-transparent m-0 md:my-[8px] pb-20 md:pb-0">
				{/* Large Back Arrow */}
				<div className="pt-[16px] mb-[20px] px-[16px] md:px-[32px]">
					<Link
						href="/stage/acts"
						className="flex items-center gap-[8px] text-white-900 hover:text-white-700 transition-colors group"
					>
						<ChevronLeftIcon className="size-[24px] group-hover:-translate-x-1 transition-transform" />
						<span className="text-[16px] font-medium">Back to Acts</span>
					</Link>
				</div>

				{/* App Info Section */}
				<div className="space-y-[16px] px-[16px] md:px-[32px] text-center md:text-left mt-[20px]">
					{/* App Thumbnail */}
					<div className="w-[96px] h-[96px] rounded-[16px] bg-white/5 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
						<svg
							role="img"
							aria-label="App icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 486 640"
							className="h-[48px] w-[48px] text-white/40"
							fill="currentColor"
						>
							<title>App Icon</title>
							<path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
							<path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.650 106.638 370.506 55.3433 370.506 0Z" />
						</svg>
					</div>

					{/* App Name */}
					<div>
						<h1 className="text-[24px] font-semibold text-white-900 mb-[4px]">
							{appName}
						</h1>
						<p className="text-[14px] text-white-400">{teamName}</p>
					</div>

					{/* Execution Time */}
					<div className="mt-[16px]">
						<div className="flex items-center justify-center md:justify-start gap-2 text-[11px]">
							<span className="text-white/50">
								{formatExecutionDate(act.createdAt)}
							</span>
							<StatusBadge
								status={getStatusBadgeStatus(act.status)}
								variant="dot"
							>
								{act.status || "Unknown"}
							</StatusBadge>
						</div>
					</div>

					{/* Input Values Section */}
					{hasMounted &&
						act.sequences[0]?.steps[0] &&
						(() => {
							const triggerStep = act.sequences[0].steps[0];
							const triggerGeneration = stepGenerations[triggerStep.id];
							const inputs =
								triggerGeneration?.context?.inputs?.find(
									(input) => input.type === "parameters",
								)?.items || [];

							return inputs.length > 0 ? (
								<div className="mt-[24px]">
									<button
										type="button"
										className="flex items-center justify-between text-[12px] font-medium text-white/60 mb-3 w-full cursor-pointer hover:text-white/80 transition-colors"
										onClick={() => setIsInputsExpanded(!isInputsExpanded)}
									>
										<span>{inputs.length === 1 ? "Input" : "Inputs"}</span>
										<ChevronDownIcon
											className={`size-[16px] transition-transform ${
												isInputsExpanded ? "rotate-180" : ""
											}`}
										/>
									</button>
									{isInputsExpanded && (
										<div className="space-y-2">
											{inputs.map((input) => {
												// Find the corresponding parameter definition for user-friendly label
												const parameter = triggerParameters.find(
													(param) => param.id === input.name,
												);

												return (
													<div
														key={`${input.name}-${input.value}`}
														className="bg-white/5 rounded-[8px] p-3"
													>
														<div className="text-[11px] text-white/80">
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

				{/* Separator Line */}
				<div className="border-t border-white/10 my-4"></div>

				{/* Steps Section */}
				<div className="space-y-4 pb-4 px-[16px] md:px-[32px] md:flex-1 md:overflow-y-auto md:min-h-0">
					{act.sequences
						.filter((_, index) => index > 0)
						.map((sequence, sequenceIndex) => (
							<div key={sequence.id} className="space-y-3">
								{/* Step Header */}
								<div className="text-[14px] font-medium text-white/60 mb-2">
									Step {sequenceIndex + 1}
								</div>

								{/* Step Cards */}
								<div className="space-y-2">
									{sequence.steps.map((step) => {
										const isExpanded = expandedSteps.has(step.id);
										const generation = stepGenerations[step.id];

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
													href={`/stage/acts/${act.id}/${step.id}`}
													className="block group"
													onClick={handleStepClick}
												>
													<div
														className="flex w-full p-4 justify-between items-center rounded-[8px] border border-white/20 bg-transparent hover:bg-white/5 transition-colors"
														style={{
															borderColor: "rgba(181, 192, 202, 0.20)",
														}}
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
																			const modelInfo =
																				getModelInfo(generation);
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
													<div className="block md:hidden mt-2 bg-white/5 rounded-lg p-4 border border-white/10">
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
		</ActStreamReader>
	);
}
