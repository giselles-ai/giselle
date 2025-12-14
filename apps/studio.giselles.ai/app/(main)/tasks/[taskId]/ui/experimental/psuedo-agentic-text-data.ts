import type { GenerationStatus, Task } from "@giselles-ai/protocol";

export type PseudoAgenticTextToken =
	| { type: "text"; value: string }
	| { type: "stepItemName"; value: string; contentType?: string };

export type PseudoAgenticLogLine = {
	key: string;
	tokens: PseudoAgenticTextToken[];
};

type PseudoAgenticAction = {
	id: string;
	displayName: string;
	contentType: string | undefined;
	status: GenerationStatus;
	error?: string;
};

export type PseudoAgenticStep = {
	id: string;
	index: number;
	status: GenerationStatus;
	actions: PseudoAgenticAction[];
};

function textToken(value: string): PseudoAgenticTextToken {
	return { type: "text", value };
}

function stepItemNameToken({
	value,
	contentType,
}: {
	value: string;
	contentType?: string;
}): PseudoAgenticTextToken {
	return { type: "stepItemName", value, contentType };
}

function buildActionNameListTokens(
	actions: PseudoAgenticAction[],
): PseudoAgenticTextToken[] {
	const tokens: PseudoAgenticTextToken[] = [];

	for (let index = 0; index < actions.length; index++) {
		const action = actions[index];
		if (action === undefined) continue;

		if (index > 0) {
			const isLast = index === actions.length - 1;
			const separator =
				actions.length === 2 ? " and " : isLast ? ", and " : ", ";
			tokens.push(textToken(separator));
		}

		tokens.push(
			stepItemNameToken({
				value: action.displayName,
				contentType: action.contentType,
			}),
		);
	}

	return tokens;
}

function hasAnyStepStarted(steps: PseudoAgenticStep[]) {
	return steps.some(
		(step) => step.status !== "created" && step.status !== "queued",
	);
}

export function buildPseudoAgenticTextLines({
	taskStatus,
	steps,
	totalStepsCount,
}: {
	taskStatus: Task["status"];
	steps: PseudoAgenticStep[];
	totalStepsCount: number;
}): PseudoAgenticLogLine[] {
	const lines: PseudoAgenticLogLine[] = [];

	// Only show the plan once execution has actually started (or task is terminal).
	const shouldShowPlan =
		hasAnyStepStarted(steps) ||
		taskStatus === "completed" ||
		taskStatus === "failed" ||
		taskStatus === "cancelled";

	if (shouldShowPlan) {
		lines.push({
			key: "intro-plan",
			tokens: [
				textToken("Plan: run "),
				textToken(String(totalStepsCount)),
				textToken(
					totalStepsCount === 1 ? " step in order. " : " steps in order. ",
				),
				textToken("Each step may execute one or more actions in parallel."),
			],
		});
	}

	// Append-only feel: emit only events that have definitely happened (completed/failed/cancelled),
	// but keep a Step-start narration once a Step moves beyond created/queued.
	for (const [stepIndex, step] of steps.entries()) {
		const stepNumber = step.index + 1;
		const actionCount = step.actions.length;
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
					...buildActionNameListTokens(step.actions),
					textToken("."),
				],
			});
		}

		for (const action of step.actions) {
			if (action.status === "completed") {
				lines.push({
					key: `step-${step.id}-item-${action.id}-completed`,
					tokens: [
						textToken("Completed: "),
						stepItemNameToken({
							value: action.displayName,
							contentType: action.contentType,
						}),
					],
				});
				continue;
			}

			if (action.status === "failed") {
				lines.push({
					key: `step-${step.id}-item-${action.id}-failed`,
					tokens: [
						textToken(`[Step ${stepNumber}] Failed: `),
						stepItemNameToken({
							value: action.displayName,
							contentType: action.contentType,
						}),
						textToken(" — "),
						textToken(action.error ?? "Unknown error"),
					],
				});
				lines.push({
					key: `step-${step.id}-failed`,
					tokens: [textToken(`Step ${stepNumber} failed. Stopping execution.`)],
				});
				return lines;
			}

			if (action.status === "cancelled") {
				lines.push({
					key: `step-${step.id}-item-${action.id}-cancelled`,
					tokens: [
						textToken(`[Step ${stepNumber}] Cancelled: `),
						stepItemNameToken({
							value: action.displayName,
							contentType: action.contentType,
						}),
					],
				});
				lines.push({
					key: `step-${step.id}-cancelled`,
					tokens: [
						textToken(`Step ${stepNumber} was cancelled. Stopping execution.`),
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
		const lastStep = steps.at(-1);
		const lastActions = lastStep?.actions ?? [];
		lines.push({
			key: "task-completed",
			tokens: [
				textToken("All steps completed."),
				...(lastActions.length > 0
					? [textToken(" Multiple outputs are available.")]
					: []),
			],
		});
	} else if (taskStatus === "failed") {
		lines.push({
			key: "task-failed",
			tokens: [
				textToken(
					"Execution failed. Review the failed step above for details.",
				),
			],
		});
	} else if (taskStatus === "cancelled") {
		lines.push({
			key: "task-cancelled",
			tokens: [textToken("Execution was cancelled.")],
		});
	}

	return lines;
}
