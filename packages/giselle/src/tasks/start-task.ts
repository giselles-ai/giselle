import { GenerationOrigin, TaskId } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import type { OnGenerationComplete, OnGenerationError } from "../generations";
import type { GiselleContext } from "../types";
import { getTask } from "./get-task";
import { patches } from "./object/patch-creators";
import { patchTask } from "./patch-task";
import { runTask } from "./run-task";

export const StartTaskInputs = z.object({
	taskId: TaskId.schema,
	generationOriginType: z.enum(
		GenerationOrigin.options.map((option) => option.shape.type.value),
	),
});
export type StartTaskInputs = z.infer<typeof StartTaskInputs>;

export async function startTask({
	taskId,
	context,
	generationOriginType,
	onGenerationComplete,
	onGenerationError,
}: StartTaskInputs & {
	context: GiselleContext;
	onGenerationComplete?: OnGenerationComplete;
	onGenerationError?: OnGenerationError;
}) {
	const task = await getTask({ context, taskId });

	if (task.status !== "created") {
		throw new Error(`Task ${taskId} is not in the created state`);
	}

	await patchTask({
		context,
		taskId,
		patches: [patches.status.set("inProgress")],
	});

	switch (context.runTaskProcess.type) {
		case "self":
			context.waitUntil(
				async () =>
					await runTask({
						context,
						taskId,
						onGenerationComplete,
						onGenerationError,
					}),
			);
			break;
		case "external":
			await context.runTaskProcess.process({
				context,
				task,
				generationOriginType,
			});
			break;
		default: {
			const _exhaustiveCheck: never = context.runTaskProcess;
			throw new Error(`Unhandled runTaskProcess type: ${_exhaustiveCheck}`);
		}
	}
}
