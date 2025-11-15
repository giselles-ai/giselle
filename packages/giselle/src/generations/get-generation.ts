import type { GenerationId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
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
