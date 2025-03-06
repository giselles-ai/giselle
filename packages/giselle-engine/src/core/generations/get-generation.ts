import type { GenerationId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getGeneration as getGenerationInternal } from "./utils";

export async function getGeneration(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
}) {
	return await getGenerationInternal({
		storage: args.context.storage,
		generationId: args.generationId,
	});
}
