import type { Task } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import type { OnGenerationComplete, OnGenerationError } from "../generations";
import type { GiselleContext } from "../types";
import { CreateTaskInputs, createTask } from "./create-task";
import { type RunTaskCallbacks, runTask } from "./run-task";
import { StartTaskInputs } from "./start-task";

interface CreateAndStartTaskCallbacks extends RunTaskCallbacks {
	taskCreate?: (args: { task: Task }) => void | Promise<void>;
	generationComplete?: OnGenerationComplete;
	generationError?: OnGenerationError;
}

export const CreateAndStartTaskInputs = z.object({
	...CreateTaskInputs.shape,
	...StartTaskInputs.omit({ taskId: true }).shape,
	...z.object({
		callbacks: z.optional(z.custom<CreateAndStartTaskCallbacks>()),
	}).shape,
});
export type CreateAndStartTaskInputs = z.infer<typeof CreateAndStartTaskInputs>;

/** @todo telemetry */
export async function createAndStartTask(
	args: CreateAndStartTaskInputs & {
		context: GiselleContext;
	},
) {
	const { task } = await createTask(args);
	await args.callbacks?.taskCreate?.({ task });
	await runTask({
		context: args.context,
		taskId: task.id,
		callbacks: args.callbacks,
		onGenerationComplete: args.callbacks?.generationComplete,
		onGenerationError: args.callbacks?.generationError,
	});
}
