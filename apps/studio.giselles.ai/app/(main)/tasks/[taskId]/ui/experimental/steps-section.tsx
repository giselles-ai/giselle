import type { TaskId } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { ChevronDownIcon } from "lucide-react";
import { Accordion } from "radix-ui";
import { giselle } from "@/app/giselle";
import { StepItemStatusIcon } from "./step-item-icon";
import type { UIStep } from "./types";

export async function getStepsSectionData(taskId: TaskId) {
	const task = await giselle.getTask({ taskId });
}

interface StepsSectionProps {
	title: string;
	totalStepsCount: number;
	completedStepsCount: number;
	steps: UIStep[];
}

export function StepsSection({
	title,
	totalStepsCount,
	completedStepsCount,
	steps,
}: StepsSectionProps) {
	return (
		<Accordion.Root type="single" className="w-full mt-6">
			<Accordion.Item value="step-list">
				<Accordion.Header>
					<Accordion.Trigger
						type="button"
						className="group flex items-center gap-2 text-text-muted text-[13px] font-semibold mb-4 py-2 w-full cursor-pointer hover:text-text-muted transition-colors"
					>
						<div className="flex items-center gap-2">
							<span className="block">{title}</span>
							<div className="flex items-center gap-1 text-[11px] text-text-muted/80">
								<div
									className="relative h-[6px] w-16 overflow-hidden rounded-full bg-white/5"
									aria-hidden="true"
								>
									<div
										className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(131,157,195,1),rgba(129,140,248,1))] transition-[width] duration-500 ease-out"
										style={{
											width: `${(completedStepsCount / totalStepsCount) * 100}%`,
										}}
									/>
								</div>
								<span>
									{completedStepsCount}/{totalStepsCount}
								</span>
							</div>
						</div>
						<div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
							<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
						</div>
					</Accordion.Trigger>
				</Accordion.Header>
			</Accordion.Item>
			<Accordion.Content>
				<div className="mb-8 border-l border-border pl-3 space-y-4">
					{steps.map((step) => (
						<div
							key={step.id}
							className="grid grid-cols-[72px_540px] items-start gap-3"
						>
							<p
								className={clsx(
									"text-[13px] font-medium",
									step.status === "completed"
										? "text-[hsl(192,73%,84%)]/70"
										: step.status === "running"
											? "bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[hsl(192,73%,84%)] via-[hsl(192,73%,84%)_50%] to-[hsl(192,73%,84%)] text-transparent animate-shimmer"
											: "text-text-muted/50",
								)}
							>
								{step.title}
							</p>
							<div className="space-y-2">
								{step.items.map((item) => (
									<Accordion.Root type="single" key={item.id}>
										<Accordion.Item value={item.id} disabled={!item.finished}>
											<Accordion.Header>
												<Accordion.Trigger className="group flex-1 flex items-center gap-3 text-left cursor-pointer disabled:cursor-default">
													<div className="flex items-center gap-3 text-left">
														<StepItemStatusIcon
															status={item.status}
															operationNode={item.node}
														/>
														<span className="text-[13px] text-text-muted/70 group-hover:text-text-muted transition-colors">
															{item.title}
														</span>
														{item.subLabel && (
															<span className="text-[13px] text-text-muted/70 group-hover:text-text-muted transition-colors">
																{item.subLabel}
															</span>
														)}
													</div>
												</Accordion.Trigger>
												{/* Layer 2: Run in Studio Only Chip (only for failed steps) */}
												{/*{step.status === "failed" && <RunInStudioOnlyChip />}*/}

												{/* Layer 3: Step Error State */}
												{/*{step.status === "failed" && (
													<StepErrorState
														workspaceId={workspaceId}
														stepId={step.id}
													/>
												)}*/}
											</Accordion.Header>

											{/* Step Content Accordion */}
											{/*{isExpanded && hasOutput && generation && (
												<div className="ml-4 pl-4 border-l-2 border-border">
													<div className="py-4 [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
														<GenerationView generation={generation} />
													</div>
												</div>
											)}*/}
											<Accordion.Content>
												<div className="ml-4 pl-4 border-l-2 border-border">
													<div className="py-4 [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
														{/*<GenerationView generation={generation} />*/}
														todo: generation
													</div>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									</Accordion.Root>
								))}
							</div>
						</div>
					))}
				</div>
			</Accordion.Content>
		</Accordion.Root>
	);
}
