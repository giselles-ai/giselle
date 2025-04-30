import type { CancelledGeneration, GenerationId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getGeneration, setGeneration, setNodeGenerationIndex } from "./utils";

export async function cancelGeneration(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
}) {
	const generation = await getGeneration({
		storage: args.context.storage,
		generationId: args.generationId,
	});
	if (generation === undefined) {
		throw new Error(`Generation ${args.generationId} not found`);
	}
	const cancelledGeneration: CancelledGeneration = {
		...generation,
		status: "cancelled",
		cancelledAt: Date.now(),
	};
	await Promise.all([
		setGeneration({
			storage: args.context.storage,
			generation: cancelledGeneration,
		}),
		setNodeGenerationIndex({
			storage: args.context.storage,
			nodeId: generation.context.operationNode.id,
			origin: generation.context.origin,
			nodeGenerationIndex: {
				id: generation.id,
				nodeId: generation.context.operationNode.id,
				status: "cancelled",
				createdAt: generation.createdAt,
				queuedAt: Date.now(),
				cancelledAt: Date.now(),
			},
		}),
	]);
	return cancelledGeneration;
}
