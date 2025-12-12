import {
	type Generation,
	type GenerationStatus,
	isOperationNode,
	type OperationNode,
	type SequenceId,
	type StepId,
	type TaskId,
} from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { ChevronDownIcon } from "lucide-react";
import { Accordion } from "radix-ui";
import { giselle } from "@/app/giselle";
import { StepItemStatusIcon } from "./step-item-icon";

export interface UIStepItem {
	/**
	 * In the protocol, the structure is Sequence > Step,
	 * but in the UI it's Step > StepItem,
	 * so this is awkward but works
	 */
	id: StepId;
	title: string;
	subLabel?: string;
	node: OperationNode;
	status: GenerationStatus;
	finished: boolean;
}
export interface UIStep {
	/**
	 * In the protocol, the structure is Sequence > Step,
	 * but in the UI it's Step > StepItem,
	 * so this is awkward but works
	 */
	id: SequenceId;
	/**  0-based */
	index: number;
	/** "Step 1" / "Step 2"*/
	title: string;
	/**
	 * Overall status of the step
	 * (e.g., failed if any item inside is failed)
	 */
	status: GenerationStatus;
	items: UIStepItem[];
}

export async function getStepsSectionData(taskId: TaskId) {
	const task = await giselle.getTask({ taskId });

	const allSteps = task.sequences.flatMap((sequence) => sequence.steps);

	const generationsByStepId = new Map<StepId, Generation | undefined>();

	await Promise.all(
		allSteps.map(async (step) => {
			try {
				const generation = await giselle.getGeneration(step.generationId);
				generationsByStepId.set(step.id, generation);
			} catch (error) {
				console.warn(
					`Failed to fetch generation for task ${taskId}, step ${step.id}:`,
					error,
				);
				generationsByStepId.set(step.id, undefined);
			}
		}),
	);

	const totalStepsCount = allSteps.length;
	const completedStepsCount = allSteps.filter(
		(step) => step.status === "completed",
	).length;
	const preparingStepsCount = allSteps.filter(
		(step) => step.status === "queued",
	).length;

	// Find the first running step's sequence number (1-based)
	let runningStepNumber: number | null = null;
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
			runningStepNumber = sequenceIndex + 1;
			break;
		}
	}

	// Determine status text based on current step states (priority: Running > Preparing > Completed)
	const title =
		runningStepNumber !== null
			? `Running Step ${runningStepNumber}`
			: preparingStepsCount > 0
				? `Preparing ${preparingStepsCount} step${
						preparingStepsCount !== 1 ? "s" : ""
					}`
				: `Completed ${completedStepsCount} step${
						completedStepsCount !== 1 ? "s" : ""
					}`;

	const steps: UIStep[] = task.sequences.map((sequence, sequenceIndex) => ({
		id: sequence.id,
		index: sequenceIndex,
		title: `Step ${sequenceIndex + 1}`,
		status: sequence.status,
		items: sequence.steps
			.map((step) => {
				const generation = generationsByStepId.get(step.id);
				if (generation === undefined) {
					return null;
				}
				const node = generation.context.operationNode;
				if (!isOperationNode(node)) {
					return null;
				}

				const subLabel =
					node.content.type === "textGeneration"
						? node.content.llm.id !== step.name
							? node.content.llm.id
							: undefined
						: node.content.type === "imageGeneration"
							? node.content.llm.id !== step.name
								? node.content.llm.id
								: undefined
							: undefined;

				return {
					id: step.id,
					title: step.name || "Untitled",
					subLabel,
					node,
					status: step.status,
					finished:
						step.status === "completed" ||
						step.status === "failed" ||
						step.status === "cancelled",
				} satisfies UIStepItem;
			})
			.filter((itemOrNull) => itemOrNull !== null),
	}));

	return {
		title,
		totalStepsCount,
		completedStepsCount,
		steps,
	} satisfies StepsSectionProps;
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
	const progressRatio =
		totalStepsCount > 0 ? completedStepsCount / totalStepsCount : 0;
	return (
		<Accordion.Root type="single" className="w-full mt-6" collapsible>
			<Accordion.Item value="step-list">
				<Accordion.Header>
					<Accordion.Trigger
						type="button"
						className="group flex items-center gap-2 text-text-muted text-[13px] font-semibold mb-4 py-2 w-full cursor-pointer hover:text-text-muted transition-colors"
					>
						<div className="flex items-center gap-2">
							<p className="block">{title}</p>
							<div className="flex items-center gap-1 text-[11px] text-text-muted/80">
								<div
									className="relative h-[6px] w-16 overflow-hidden rounded-full bg-white/5"
									aria-hidden="true"
								>
									<div
										className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(131,157,195,1),rgba(129,140,248,1))] transition-[width] duration-500 ease-out"
										style={{
											width: `${Math.min(Math.max(progressRatio, 0), 1) * 100}%`,
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
				<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
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
										<Accordion.Root type="single" key={item.id} collapsible>
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
												<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
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
			</Accordion.Item>
		</Accordion.Root>
	);
}
