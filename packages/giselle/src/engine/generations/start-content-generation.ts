import {
	type Generation,
	isQueuedGeneration,
	type RunningGeneration,
} from "../../concepts/generation";
import type { GiselleEngineContext } from "../types";
import { generateContent } from "./generate-content";
import { internalSetGeneration } from "./internal/set-generation";

export async function startContentGeneration({
	context,
	generation,
}: {
	context: GiselleEngineContext;
	generation: Generation;
}) {
	if (!isQueuedGeneration(generation)) {
		throw new Error(`Generation ${generation.id} is already queued`);
	}
	const runningGeneration: RunningGeneration = {
		...generation,
		status: "running",
		messages: [],
		startedAt: Date.now(),
	};
	await internalSetGeneration({
		storage: context.storage,
		experimental_storage: context.experimental_storage,
		useExperimentalStorage: true,
		generation: runningGeneration,
	});
	switch (context.generateContentProcess.type) {
		case "self":
			context.waitUntil(async () =>
				generateContent({
					context,
					generation: runningGeneration,
				}),
			);
			break;

		case "external":
			await context.generateContentProcess.process({
				context,
				generation: runningGeneration,
			});
			break;
	}
	return runningGeneration;
}
