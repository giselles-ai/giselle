import type { GenerationId } from "../../concepts/identifiers";
import type { GiselleEngineContext } from "../types";
import { getGeneration as getGenerationInternal } from "./utils";

export async function getGeneration(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	useExperimentalStorage: boolean;
}) {
	return await getGenerationInternal({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.experimental_storage,
		useExperimentalStorage: args.useExperimentalStorage,
		generationId: args.generationId,
		options: {
			bypassingCache: true,
		},
	});
}
