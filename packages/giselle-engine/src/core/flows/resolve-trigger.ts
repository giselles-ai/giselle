import {
	type CompletedGeneration,
	GenerationContext,
	type QueuedGeneration,
	isTriggerNode,
} from "@giselle-sdk/data-type";
import { setGeneration, setNodeGenerationIndex } from "../generations/utils";
import type { GiselleEngineContext } from "../types";

export async function resolveTrigger(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const operationNode = args.generation.context.operationNode;
	if (!isTriggerNode(operationNode)) {
		throw new Error("Invalid generation type");
	}
	const generationContext = GenerationContext.parse(args.generation.context);
	const completedGeneration = {
		...args.generation,
		status: "completed",
		messages: [],
		queuedAt: Date.now(),
		startedAt: Date.now(),
		completedAt: Date.now(),
		outputs: [],
	} satisfies CompletedGeneration;

	await Promise.all([
		setGeneration({
			storage: args.context.storage,
			generation: completedGeneration,
		}),
		setNodeGenerationIndex({
			storage: args.context.storage,
			nodeId: generationContext.operationNode.id,
			origin: generationContext.origin,
			nodeGenerationIndex: {
				id: completedGeneration.id,
				nodeId: completedGeneration.context.operationNode.id,
				status: "completed",
				createdAt: completedGeneration.createdAt,
				queuedAt: completedGeneration.queuedAt,
				startedAt: completedGeneration.startedAt,
				completedAt: completedGeneration.completedAt,
			},
		}),
	]);
}
