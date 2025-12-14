import {
	type Generation,
	type GenerationStatus,
	isOperationNode,
	type OperationNode,
	type ParametersInput,
	type SequenceId,
	type StepId,
	type Task,
	type TaskId,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { db, tasks } from "@/db";
import { logger } from "@/lib/logger";

type UIStepItemBase = {
	/**
	 * In the protocol, the structure is Sequence > Step,
	 * but in the UI it's Step > StepItem,
	 * so this is awkward but works
	 */
	id: StepId;
	title: string;
	subLabel?: string;
	node: OperationNode;
	finished: boolean;
};

export type UIStepItem =
	| (UIStepItemBase & {
			status: "completed";
			generation: Generation;
	  })
	| (UIStepItemBase & {
			status: "failed";
			error: string;
			workspaceId: WorkspaceId;
	  })
	| (UIStepItemBase & {
			status: Exclude<GenerationStatus, "completed" | "failed">;
	  });

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
	/**
	 * A short human-friendly progress summary shown in the Step trigger
	 * when the Step is collapsed.
	 */
	collapsedProgressText: string | null;
	items: UIStepItem[];
}

export type PseudoAgenticTextToken =
	| { type: "text"; value: string }
	| { type: "stepItemName"; value: string };

export type PseudoAgenticLogLine = {
	key: string;
	tokens: PseudoAgenticTextToken[];
};

export interface UITask {
	status: Task["status"];
	title: string;
	description: string;
	workspaceId: WorkspaceId;
	input: ParametersInput | null;
	pseudoAgenticText: {
		lines: PseudoAgenticLogLine[];
	};
	stepsSection: {
		title: string;
		totalStepsCount: number;
		completedStepsCount: number;
		steps: UIStep[];
	};
	finalStep: {
		totalStepItemsCount: number;
		finishedStepItemsCount: number;
		outputs: {
			title: string;
			generation: Generation;
		}[];
	};
}

function getStepItemDisplayName(item: UIStepItem) {
	return item.subLabel ? `${item.title} (${item.subLabel})` : item.title;
}

function textToken(value: string): PseudoAgenticTextToken {
	return { type: "text", value };
}

function stepItemNameToken(value: string): PseudoAgenticTextToken {
	return { type: "stepItemName", value };
}

function buildStepItemNameListTokens(
	items: UIStepItem[],
): PseudoAgenticTextToken[] {
	const names = items.map(getStepItemDisplayName);
	const tokens: PseudoAgenticTextToken[] = [];

	for (let index = 0; index < names.length; index++) {
		const name = names[index];
		if (name === undefined) {
			continue;
		}

		if (index > 0) {
			const isLast = index === names.length - 1;
			const separator = names.length === 2 ? " and " : isLast ? ", and " : ", ";
			tokens.push(textToken(separator));
		}
		tokens.push(stepItemNameToken(name));
	}

	return tokens;
}

function hasAnyStepStarted(steps: UIStep[]) {
	return steps.some(
		(step) => step.status !== "created" && step.status !== "queued",
	);
}

function buildPseudoAgenticTextLines({
	taskTitle,
	taskStatus,
	steps,
	totalStepsCount,
}: {
	taskTitle: string;
	taskStatus: UITask["status"];
	steps: UIStep[];
	totalStepsCount: number;
}): PseudoAgenticLogLine[] {
	const lines: PseudoAgenticLogLine[] = [];

	lines.push({
		key: "intro-boot",
		tokens: [
			{
				type: "text",
				value:
					"Agent runtime initialized. Loading task context and execution plan for ",
			},
			{ type: "stepItemName", value: taskTitle },
			{ type: "text", value: "." },
		],
	});

	// To mimic “first token” behavior: only show the plan once execution has actually started.
	// (i.e., any step moved beyond created/queued, or task reached a terminal status)
	const shouldShowPlan =
		hasAnyStepStarted(steps) ||
		taskStatus === "completed" ||
		taskStatus === "failed" ||
		taskStatus === "cancelled";

	if (shouldShowPlan) {
		lines.push({
			key: "intro-plan",
			tokens: [
				{ type: "text", value: "Plan: run " },
				{ type: "text", value: String(totalStepsCount) },
				{
					type: "text",
					value:
						totalStepsCount === 1 ? " step in order. " : " steps in order. ",
				},
				{
					type: "text",
					value: "Each step may execute one or more actions in parallel.",
				},
			],
		});
	}

	// Append-only feel: emit only events that have definitely happened (completed/failed/cancelled).
	// Avoid “running/queued” lines that would later get replaced.
	for (const [stepIndex, step] of steps.entries()) {
		const stepNumber = step.index + 1;
		const actionCount = step.items.length;
		const actionsLabel = actionCount === 1 ? "action" : "actions";
		const isStepStarted = step.status !== "created" && step.status !== "queued";

		if (isStepStarted) {
			const previousStep = steps[stepIndex - 1];
			const shouldNarrateHandoff =
				previousStep !== undefined && previousStep.status === "completed";

			lines.push({
				key: `step-${step.id}-start`,
				tokens: [
					...(shouldNarrateHandoff
						? [
								textToken(
									`Step ${stepIndex} completed. Using its results, starting Step ${stepNumber}. `,
								),
							]
						: [textToken(`Starting Step ${stepNumber}. `)]),
					textToken(`This step will run ${actionCount} ${actionsLabel}`),
					...(actionCount > 1 ? [textToken(" in parallel")] : []),
					textToken(": "),
					...buildStepItemNameListTokens(step.items),
					textToken("."),
				],
			});
		}

		for (const item of step.items) {
			if (item.status === "completed") {
				lines.push({
					key: `step-${step.id}-item-${item.id}-completed`,
					tokens: [
						{ type: "text", value: `[Step ${stepNumber}] Completed: ` },
						{ type: "stepItemName", value: getStepItemDisplayName(item) },
					],
				});
				continue;
			}
			if (item.status === "failed") {
				lines.push({
					key: `step-${step.id}-item-${item.id}-failed`,
					tokens: [
						{ type: "text", value: `[Step ${stepNumber}] Failed: ` },
						{ type: "stepItemName", value: getStepItemDisplayName(item) },
						{ type: "text", value: " — " },
						{ type: "text", value: item.error },
					],
				});
				lines.push({
					key: `step-${step.id}-failed`,
					tokens: [
						{
							type: "text",
							value: `Step ${stepNumber} failed. Stopping execution.`,
						},
					],
				});
				// Once failed, stop adding further “future” lines.
				return lines;
			}
			if (item.status === "cancelled") {
				lines.push({
					key: `step-${step.id}-item-${item.id}-cancelled`,
					tokens: [
						{ type: "text", value: `[Step ${stepNumber}] Cancelled: ` },
						{ type: "stepItemName", value: getStepItemDisplayName(item) },
					],
				});
				lines.push({
					key: `step-${step.id}-cancelled`,
					tokens: [
						{
							type: "text",
							value: `Step ${stepNumber} was cancelled. Stopping execution.`,
						},
					],
				});
				return lines;
			}
		}

		// If this step itself is not completed, do not leak later steps.
		if (step.status !== "completed") {
			break;
		}
	}

	// Final step completion line (keep it explicit, and avoid redundancy for intermediate steps).
	const lastStep = steps.at(-1);
	if (lastStep?.status === "completed") {
		const lastStepNumber = lastStep.index + 1;
		lines.push({
			key: `step-${lastStep.id}-completed`,
			tokens: [textToken(`Step ${lastStepNumber} completed.`)],
		});
	}

	if (taskStatus === "completed") {
		lines.push({
			key: "task-completed",
			tokens: [
				{
					type: "text",
					value:
						"All steps completed. Displaying the output from the last completed step below.",
				},
			],
		});
	} else if (taskStatus === "failed") {
		lines.push({
			key: "task-failed",
			tokens: [
				{
					type: "text",
					value: "Execution failed. Review the failed step above for details.",
				},
			],
		});
	} else if (taskStatus === "cancelled") {
		lines.push({
			key: "task-cancelled",
			tokens: [{ type: "text", value: "Execution was cancelled." }],
		});
	}

	return lines;
}

async function getAppByTaskId(taskId: TaskId) {
	const dbApp = await db.query.apps.findFirst({
		columns: { id: true },
		where: (apps, { and, exists, eq }) =>
			exists(
				db
					.select({ id: tasks.id })
					.from(tasks)
					.where(and(eq(tasks.appDbId, apps.dbId), eq(tasks.id, taskId))),
			),
	});
	if (dbApp === undefined) {
		throw new Error(`App not found for task ID: ${taskId}`);
	}
	return await giselle.getApp({ appId: dbApp.id });
}

/**
 * Since the input for executing a Task is not stored in the Task itself
 * but in the Generation, we retrieve it from the Generation of the first Step
 * associated with the Task.
 */
async function getTaskInput(taskId: TaskId) {
	const task = await giselle.getTask({ taskId });
	const firstStep = task.sequences[0]?.steps?.[0];
	if (firstStep === undefined) {
		logger.warn(`Task ${taskId} has no steps`);
		return null;
	}
	const firstStepGeneration = await giselle.getGeneration(
		firstStep.generationId,
	);
	if (firstStepGeneration === undefined) {
		logger.warn(`Task ${taskId}, Step ${firstStep.id} has no generation`);
		return null;
	}
	const inputs = firstStepGeneration?.context.inputs;

	// inputs is an optional array, but in the Task use case it should be
	// an array with length 1, so log a warning if it's different
	if (inputs?.length !== 1) {
		return null;
	}
	const firstInput = inputs[0];
	// github-webhook-event is not expected in this Task use case
	if (firstInput.type !== "parameters") {
		return null;
	}
	return firstInput;
}

function getCollapsedProgressText({
	items,
	status,
}: {
	items: UIStepItem[];
	status: GenerationStatus;
}): string | null {
	const totalCount = items.length;
	if (totalCount === 0) {
		return null;
	}

	// When a Step is pending (created/queued), don't show any progress summary in collapsed UI.
	if (status === "created" || status === "queued") {
		return null;
	}

	const doneCount = items.filter((item) => item.status === "completed").length;
	const failedCount = items.filter((item) => item.status === "failed").length;
	const cancelledCount = items.filter(
		(item) => item.status === "cancelled",
	).length;

	const inProgressCount = totalCount - doneCount - failedCount - cancelledCount;
	const inProgressText =
		inProgressCount === 1
			? "1 action in progress"
			: `${inProgressCount} actions in progress`;

	// Prefer simple, user-friendly labels and avoid "step items" terminology.
	if (status === "completed" && doneCount === totalCount) {
		return "Done";
	}
	if (status === "failed" || failedCount > 0) {
		return doneCount > 0
			? `Failed • ${doneCount}/${totalCount} done`
			: "Failed";
	}
	if (status === "cancelled" || cancelledCount > 0) {
		return doneCount > 0
			? `Cancelled • ${doneCount}/${totalCount} done`
			: "Cancelled";
	}

	if (doneCount === 0) {
		return inProgressText;
	}
	if (inProgressCount > 0) {
		return `${doneCount}/${totalCount} done • ${inProgressText}`;
	}
	return `${doneCount}/${totalCount} done`;
}

export async function getTaskData(taskId: TaskId): Promise<UITask> {
	const task = await giselle.getTask({ taskId });

	// In the API, the structure is Sequence > Step.
	// In this UI, we present it as Step (Sequence) > StepItem (Step).
	const allStepItems = task.sequences.flatMap((sequence) => sequence.steps);

	const generationsByStepId = new Map<StepId, Generation | undefined>();

	await Promise.all(
		allStepItems.map(async (step) => {
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

	// Use UI "Step" counts (API "Sequence" count) for summary/progress.
	const totalStepsCount = task.sequences.length;
	const completedStepsCount = task.sequences.filter(
		(sequence) => sequence.status === "completed",
	).length;
	const preparingStepsCount = task.sequences.filter(
		(sequence) => sequence.status === "queued" || sequence.status === "created",
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

	const steps: UIStep[] = task.sequences.map((sequence, sequenceIndex) => {
		const items = sequence.steps
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

				switch (generation.status) {
					case "cancelled":
					case "created":
					case "queued":
					case "running":
						return {
							id: step.id,
							title: step.name,
							subLabel,
							node,
							status: generation.status,
							finished: generation.status === "cancelled",
						} satisfies UIStepItem;
					case "failed":
						return {
							id: step.id,
							title: step.name,
							subLabel,
							node,
							status: "failed",
							finished: true,
							error: generation.error.message,
							workspaceId: task.workspaceId,
						} satisfies UIStepItem;
					case "completed":
						return {
							id: step.id,
							title: step.name,
							subLabel,
							node,
							status: "completed",
							finished: true,
							generation,
						} satisfies UIStepItem;
					default: {
						const _exhaustiveCheck: never = generation;
						throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
					}
				}
			})
			.filter((itemOrNull) => itemOrNull !== null);

		return {
			id: sequence.id,
			index: sequenceIndex,
			title: `Step ${sequenceIndex + 1}`,
			status: sequence.status,
			collapsedProgressText: getCollapsedProgressText({
				items,
				status: sequence.status,
			}),
			items,
		};
	});

	const lastUiStep = steps.at(-1);
	const totalStepItemsCount = lastUiStep?.items.length ?? 0;
	const finishedStepItemsCount =
		lastUiStep?.items.filter((item) => item.finished).length ?? 0;

	// Keep the ideal behavior (all final step outputs) for later.
	const outputs =
		lastUiStep?.items
			.map((item) => {
				const generation =
					item.status === "completed"
						? item.generation
						: generationsByStepId.get(item.id);
				if (generation === undefined) {
					return null;
				}
				return { title: item.title, generation };
			})
			.filter((outputOrNull) => outputOrNull !== null) ?? [];

	const [workspace, app, input] = await Promise.all([
		giselle.getWorkspace(task.workspaceId),
		getAppByTaskId(taskId),
		getTaskInput(taskId),
	]);

	const taskTitle = `${workspace.name}:${taskId}`;
	const pseudoAgenticLines = buildPseudoAgenticTextLines({
		taskTitle,
		taskStatus: task.status,
		steps,
		totalStepsCount,
	});

	return {
		status: task.status,
		title: taskTitle,
		description: app.description,
		workspaceId: task.workspaceId,
		input,
		pseudoAgenticText: { lines: pseudoAgenticLines },
		stepsSection: {
			title,
			totalStepsCount,
			completedStepsCount,
			steps,
		},
		finalStep: {
			totalStepItemsCount,
			finishedStepItemsCount,
			outputs,
		},
	};
}
