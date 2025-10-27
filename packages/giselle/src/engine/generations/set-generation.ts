import type { Generation } from "../../concepts/generation";
import type { GiselleEngineContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";

export async function setGeneration(args: {
	context: GiselleEngineContext;
	generation: Generation;
	useExperimentalStorage: boolean;
}) {
	await internalSetGeneration({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.experimental_storage,
		useExperimentalStorage: args.useExperimentalStorage,
		generation: args.generation,
		logger: args.context.logger,
	});
}
