import type { CancelledGeneration } from "../../concepts/generation";
import type { GenerationId } from "../../concepts/identifiers";
import type { GiselleEngineContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";
import { getGeneration } from "./utils";

export async function cancelGeneration(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	useExperimentalStorage: boolean;
}) {
	const generation = await getGeneration({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
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
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
		generation: cancelledGeneration,
	});
	return cancelledGeneration;
}
