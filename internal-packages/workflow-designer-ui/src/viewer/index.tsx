"use client";

import { WorkflowId } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import {
	useRun,
	useRunController,
	useWorkflowDesigner,
} from "giselle-sdk/react";
import {
	CircleCheckIcon,
	CircleSlashIcon,
	PencilIcon,
	X,
	XCircleIcon,
} from "lucide-react";
import { Dialog, Tabs } from "radix-ui";
import { useMemo, useState } from "react";
import { useUsageLimitsReached } from "../hooks/usage-limits";
import { SpinnerIcon, WilliIcon } from "../icons";
import bg from "../images/bg.png";
import { Background } from "../ui/background";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { GenerationView } from "../ui/generation-view";
import { NodeGlance } from "../ui/node-glance";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { UsageLimitWarning } from "../ui/usage-limit-warning";
import { RunWithOverrideParamsForm } from "./run-with-override-params-form";

export function Viewer() {
	const { generations, run } = useRun();
	const { perform, isRunning, cancel } = useRunController();
	const { data } = useWorkflowDesigner();
	const usageLimitsReached = useUsageLimitsReached();

	const [flowId, setFlowId] = useState<WorkflowId | undefined>(
		data.editingWorkflows.length === 1
			? data.editingWorkflows[0].id
			: undefined,
	);
	const flow = useMemo(
		() => data.editingWorkflows.find((flow) => flow.id === flowId),
		[flowId, data.editingWorkflows],
	);
	return (
		<div className="w-full flex-1 px-[16px] pb-[16px] font-sans overflow-hidden bg-black-900">
			<div className="rounded-[8px] overflow-hidden h-full relative">
				<div className="flex flex-col h-full text-white-900 px-[16px] py-[16px] gap-[16px] z-1 relative">
					<Tabs.Root orientation="horizontal" className="flex h-full">
						<Tabs.List className="w-[180px] flex flex-col gap-[16px] overflow-y-auto">
							<div className="flex flex-col gap-[8px]">
								{data.editingWorkflows.length > 1 && (
									<Select
										onValueChange={(value) => {
											setFlowId(WorkflowId.parse(value));
										}}
										defaultValue={flowId}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select Flow" />
										</SelectTrigger>
										<SelectContent>
											{data.editingWorkflows.map((workflow, index) => (
												<SelectItem key={workflow.id} value={workflow.id}>
													Flow {index + 1}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}

								{usageLimitsReached && <UsageLimitWarning />}

								{flow &&
									(isRunning ? (
										<Button
											type="button"
											onClick={() => {
												cancel();
											}}
											data-loading="true"
											disabled={true}
										>
											Stop
										</Button>
									) : (
										<div className="w-full relative">
											<Button
												type="button"
												disabled={usageLimitsReached}
												className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
												onClick={() => {
													if (usageLimitsReached) {
														return;
													}
													perform(flow.id);
												}}
											>
												Run
											</Button>
											<div className="absolute right-0 pr-[8px] top-[50%] translate-y-[-50%] h-full flex items-center justify-center">
												<div className="w-[1px] h-full border-l border-white-800/40 mr-[6px]" />
												<Dialog.Root>
													<Dialog.Trigger asChild>
														<button
															type="button"
															className="hover:bg-black-800/20 rounded-[4px]"
														>
															<PencilIcon className="size-[18px]" />
														</button>
													</Dialog.Trigger>
													<Dialog.Portal>
														<Dialog.Overlay className="fixed inset-0 bg-black/25 z-50" />
														<Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[900px] h-[600px] bg-black-900 rounded-[12px] p-[24px] shadow-xl z-50 overflow-hidden border border-black-400">
															<Dialog.Title className="sr-only">
																Override inputs to test workflow
															</Dialog.Title>
															<Dialog.Close
																asChild
																className="absolute right-[24px] cursor-pointer"
															>
																<button
																	type="button"
																	className="text-white-400 hover:text-white-900"
																>
																	<X className="size-[20px]" />
																</button>
															</Dialog.Close>
															<RunWithOverrideParamsForm flow={flow} />
														</Dialog.Content>
													</Dialog.Portal>
												</Dialog.Root>
											</div>
										</div>
									))}
							</div>
							<div className="flex flex-col gap-[24px]">
								{flow?.jobs.map((job, index) => (
									<div key={job.id} className="flex flex-col gap-[8px]">
										<p className="text-black-400 text-[12px] font-[700]">
											Step {index + 1}
										</p>
										{job.operations.map((operation) => (
											<Tabs.Trigger
												value={operation.node.id}
												className={clsx(
													"[w-180px] flex p-[16px] justify-between items-center border border-black-200/20 rounded-[8px] gap-[4px]",
													"hover:border-black-200/60",
													"data-[state=active]:border-primary-900",
													"transition-colors",
												)}
												key={`tabs-trigger-${operation.node.id}`}
											>
												<NodeGlance
													node={operation.node}
													iconClassName="rounded-[8px] bg-white-950 text-black-950 flex items-center justify-center p-[8px] **:data-content-type-icon:size-[16px]"
													nameClassName="text-white-900 text-[12px] font-[700] truncate w-full"
													descriptionClassName="text-black-400 text-[10px]"
												/>
												{generations
													.filter(
														(generation) =>
															generation.context.operationNode.id ===
															operation.node.id,
													)
													.map((generation) => {
														switch (generation.status) {
															case "created":
															case "queued":
															case "running":
																return (
																	<SpinnerIcon
																		className="size-[22px] text-white-800 animate-follow-through-overlap-spin shrink-0"
																		key={generation.id}
																	/>
																);
															case "completed":
																return (
																	<CircleCheckIcon
																		className="size-[22px] text-success-900 shrink-0"
																		key={generation.id}
																	/>
																);
															case "failed":
																return (
																	<XCircleIcon
																		className="size-[22px] text-error-900 shrink-0"
																		key={generation.id}
																	/>
																);
															case "cancelled":
																return (
																	<CircleSlashIcon
																		className="size-[22px] text-white-800 shrink-0"
																		key={generation.id}
																	/>
																);
															default: {
																const _exhaustiveCheck: never =
																	generation.status;
																throw new Error(
																	`Unhandled status: ${_exhaustiveCheck}`,
																);
															}
														}
													})}
											</Tabs.Trigger>
										))}
									</div>
								))}
							</div>
						</Tabs.List>
						<div className="overflow-y-auto flex-1 pb-[20px]">
							{(!run || run.status === "created") && (
								<div className="h-full flex items-center justify-center">
									<EmptyState
										icon={
											<WilliIcon className="fill-current w-[32px] h-[32px] text-black-300" />
										}
										title="No preview generated yet."
										description="Select a Flow and click the Run button to run your nodes and create the final output."
									/>
								</div>
							)}
							{run &&
								run.status !== "created" &&
								run?.workflow?.jobs.flatMap((job) =>
									job.operations.map(({ node }) => (
										<Tabs.Content
											key={node.id}
											value={node.id}
											className="px-[32px] py-[16px] flex flex-col gap-[24px]"
										>
											<NodeGlance
												node={node}
												iconClassName="rounded-[8px] bg-white-950 text-black-950 flex items-center justify-center p-[8px] **:data-content-type-icon:size-[26px]"
												nameClassName="text-white-900 text-[20px] font-[700]"
												descriptionClassName="text-black-400 text-[12px]"
											/>
											{generations
												.filter(
													(g) =>
														g.status !== "created" &&
														g.context.operationNode.id === node.id,
												)
												.sort((a, b) => a.createdAt - b.createdAt)
												.map((generation) => (
													<div
														key={generation.id}
														className="markdown-renderer"
													>
														<GenerationView generation={generation} />
													</div>
												))}
										</Tabs.Content>
									)),
								)}
						</div>
					</Tabs.Root>
				</div>
				<div className="absolute h-full w-full z-0 inset-0">
					<Background />
				</div>
			</div>
		</div>
	);
}
