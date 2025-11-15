import type { CancelledGeneration, GenerationId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";
import { getGeneration } from "./utils";

export async function cancelGeneration(args: {
	context: GiselleContext;
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
