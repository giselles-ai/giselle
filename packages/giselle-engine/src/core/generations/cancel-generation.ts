import type { CancelledGeneration, GenerationId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";
import { getGeneration } from "./utils";

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
	await internalSetGeneration({
		storage: args.context.storage,
		generation: cancelledGeneration,
	});
	return cancelledGeneration;
}
