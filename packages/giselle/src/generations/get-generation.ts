import type { GenerationId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { getGeneration as getGenerationInternal } from "./utils";

export async function getGeneration(args: {
	context: GiselleContext;
	generationId: GenerationId;
}) {
	return await getGenerationInternal({
		storage: args.context.storage,
		generationId: args.generationId,
	});
}
