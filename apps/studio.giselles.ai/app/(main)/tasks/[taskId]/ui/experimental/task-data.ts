import {
	type AppId,
	type Generation,
	type GenerationStatus,
	isCompletedGeneration,
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

export type UIOutputType = "text" | "markdown" | "json" | "image" | "other";

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
	items: UIStepItem[];
}

export interface UITask {
	status: Task["status"];
	title: string;
	description: string;
	workspaceId: WorkspaceId;
	input: ParametersInput | null;
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
			id: string;
			title: string;
			type: UIOutputType;
			generation: Generation;
		}[];
	};
}

function isLikelyMarkdown(content: string) {
	const text = content.trim();
	return (
		text.includes("```") ||
		text.includes("\n") ||
		/^#{1,6}\s/m.test(text) ||
		/^\s*[-*]\s+/m.test(text) ||
		/\[[^\]]+\]\([^)]+\)/.test(text)
	);
}

function getOutputType(generation: Generation): UIOutputType {
	if (!isCompletedGeneration(generation)) {
		return "other";
	}

	const textOutput = generation.outputs.find(
		(o) => o.type === "generated-text",
	);
	if (textOutput?.type === "generated-text") {
		return isLikelyMarkdown(textOutput.content) ? "markdown" : "text";
	}

	const queryResult = generation.outputs.find((o) => o.type === "query-result");
	if (queryResult?.type === "query-result") {
		return "json";
	}

	const imageOutput = generation.outputs.find(
		(o) => o.type === "generated-image",
	);
	if (imageOutput?.type === "generated-image") {
		return "image";
	}

	const reasoning = generation.outputs.find((o) => o.type === "reasoning");
	if (reasoning?.type === "reasoning") {
		return isLikelyMarkdown(reasoning.content) ? "markdown" : "text";
	}

	const sources = generation.outputs.find((o) => o.type === "source");
	if (sources?.type === "source") {
		return "json";
	}

	return "other";
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

export async function getTaskAppId(taskId: TaskId): Promise<AppId> {
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
	return dbApp.id;
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

export async function getTaskData(taskId: TaskId): Promise<UITask> {
	const task = await giselle.getTask({ taskId });
	if (task.nodeIdsConnectedToEnd === undefined) {
		// This page expects a "new" task shape that includes nodeIdsConnectedToEnd.
		// If it's missing, fail fast to surface data inconsistencies early.
		throw new Error(`Task ${taskId} is missing nodeIdsConnectedToEnd`);
	}

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
			.filter((itemOrNull) => itemOrNull !== null),
	}));

	const allUiStepItems = steps.flatMap((step) => step.items);
	const finalStepItems = task.nodeIdsConnectedToEnd
		.map((nodeId) => allUiStepItems.find((item) => item.node.id === nodeId))
		.filter((itemOrUndefined) => itemOrUndefined !== undefined);

	const totalStepItemsCount = finalStepItems.length;
	const finishedStepItemsCount = finalStepItems.filter(
		(item) => item.finished,
	).length;

	const outputs = finalStepItems
		.map((item) => {
			const generation =
				item.status === "completed"
					? item.generation
					: generationsByStepId.get(item.id);
			if (generation === undefined) {
				return null;
			}
			const type = getOutputType(generation);
			return {
				id: generation.id,
				title: item.title,
				type,
				generation,
			};
		})
		.filter((outputOrNull) => outputOrNull !== null);

	const [workspace, app, input] = await Promise.all([
		giselle.getWorkspace(task.workspaceId),
		getAppByTaskId(taskId),
		getTaskInput(taskId),
	]);

	return {
		status: task.status,
		title: `${workspace.name}:${taskId}`,
		description: app.description,
		workspaceId: task.workspaceId,
		input,
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
