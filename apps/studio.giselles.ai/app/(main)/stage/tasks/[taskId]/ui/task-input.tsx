import type {
	ParameterItem,
	TaskId,
	UploadedFileData,
} from "@giselles-ai/protocol";
import { use } from "react";
import { giselle } from "@/app/giselle";
import { logger } from "@/lib/logger";

/**
 * Since the input for executing a Task is not stored in the Task itself
 * but in the Generation, we retrieve it from the Generation of the first Step
 * associated with the Task.
 */
export async function getTaskInput(taskId: TaskId) {
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
type TaskInput = Awaited<ReturnType<typeof getTaskInput>>;

function TaskInputItemFile({ file }: { file: UploadedFileData }) {
	return <p>{file.name}</p>;
}

function TaskInputItem({ item }: { item: ParameterItem }) {
	switch (item.type) {
		case "files":
			return item.value.map((file) => (
				<TaskInputItemFile key={file.id} file={file} />
			));
		case "number":
			return <p>{item.value}</p>;
		case "string":
			return <p>{item.value}</p>;
		default: {
		}
	}
}
export function TaskInput({
	taskInputPromise,
}: {
	taskInputPromise: Promise<TaskInput>;
}) {
	const taskInput = use(taskInputPromise);
	return (
		<div className="rounded-[10px] border border-blue-muted/40 bg-blue-muted/7 px-3 py-2 text-[13px] text-text/80">
			{taskInput == null ? (
				<p>No task input</p>
			) : (
				taskInput.items.map((item) => (
					<TaskInputItem key={item.name} item={item} />
				))
			)}
		</div>
	);
}
