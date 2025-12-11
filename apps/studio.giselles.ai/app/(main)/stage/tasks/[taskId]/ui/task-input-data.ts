import type { TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { logger } from "@/lib/logger";
import type { TaskInputData } from "./task-input-types";

/**
 * Since the input for executing a Task is not stored in the Task itself
 * but in the Generation, we retrieve it from the Generation of the first Step
 * associated with the Task.
 */
export async function getTaskInput(taskId: TaskId): Promise<TaskInputData> {
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
