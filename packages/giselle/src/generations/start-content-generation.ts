import {
	type Generation,
	isQueuedGeneration,
	type RunningGeneration,
} from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { generateContent } from "./generate-content";
import { internalSetGeneration } from "./internal/set-generation";
import type { GenerationMetadata } from "./types";

export async function startContentGeneration({
	context,
	generation,
	metadata,
}: {
	context: GiselleEngineContext;
	generation: Generation;
	metadata?: GenerationMetadata;
}) {
	if (!isQueuedGeneration(generation)) {
		throw new Error(`Generation ${generation.id} is not queued`);
	}
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
				metadata,
			});
			break;
	}
	return runningGeneration;
}
