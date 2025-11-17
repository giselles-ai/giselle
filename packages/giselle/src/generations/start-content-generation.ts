import {
	type Generation,
	isQueuedGeneration,
	type RunningGeneration,
} from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { generateContent } from "./generate-content";
import { internalSetGeneration } from "./internal/set-generation";
import type {
	GenerationMetadata,
	OnGenerationComplete,
	OnGenerationError,
} from "./types";

export async function startContentGeneration({
	context,
	generation,
	metadata,
	onComplete,
	onError,
}: {
	context: GiselleContext;
	generation: Generation;
	metadata?: GenerationMetadata;
	onComplete?: OnGenerationComplete;
	onError?: OnGenerationError;
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
					onComplete,
					onError,
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
