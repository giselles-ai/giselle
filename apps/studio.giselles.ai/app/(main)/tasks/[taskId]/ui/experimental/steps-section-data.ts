import {
	type Generation,
	type GenerationStatus,
	isOperationNode,
	type OperationNode,
	type SequenceId,
	type StepId,
	type Task,
	type TaskId,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

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

	return {
		title,
		totalStepsCount,
		completedStepsCount,
		steps,
		status: task.status,
	} satisfies StepsSectionData;
}

export interface StepsSectionData {
	title: string;
	status: Task["status"];
	totalStepsCount: number;
	completedStepsCount: number;
	steps: UIStep[];
}
