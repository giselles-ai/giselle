import type { GenerationId } from "../../concepts/identifiers";
import type { GiselleEngineContext } from "../types";
import { getGeneration as getGenerationInternal } from "./utils";

export async function getGeneration(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	useExperimentalStorage: boolean;
}) {
	return await getGenerationInternal({
		deprecated_storage: args.context.deprecated_storage,
		storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
		generationId: args.generationId,
		options: {
			bypassingCache: true,
		},
	});
}
