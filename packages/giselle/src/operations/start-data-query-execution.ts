import type {
	QueuedGeneration,
	RunningGeneration,
} from "@giselles-ai/protocol";
import type { GenerationMetadata } from "../generations";
import { internalSetGeneration } from "../generations/internal/set-generation";
import type { GiselleContext } from "../types";
import { executeDataQuery } from "./execute-data-query";

export async function startDataQueryExecution({
	context,
	generation,
	metadata,
}: {
	context: GiselleContext;
	generation: QueuedGeneration;
	metadata?: GenerationMetadata;
}) {
	const runningGeneration: RunningGeneration = {
		...generation,
		status: "running",
		messages: [],
		startedAt: Date.now(),
	};
	await internalSetGeneration({
		storage: context.storage,
		generation: runningGeneration,
	});
	switch (context.executeDataQueryProcess.type) {
		case "self":
			context.waitUntil(async () =>
				executeDataQuery({
					context,
					generation: runningGeneration,
					metadata,
				}),
			);
			break;
		case "external":
			await context.executeDataQueryProcess.process({
				context,
				generation: runningGeneration,
				metadata,
			});
			break;
	}
	return runningGeneration;
}
