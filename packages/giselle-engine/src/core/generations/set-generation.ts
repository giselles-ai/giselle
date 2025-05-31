import type { Generation } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";

export async function setGeneration(args: {
	context: GiselleEngineContext;
	generation: Generation;
}) {
	internalSetGeneration({
		storage: args.context.storage,
		generation: args.generation,
	});
}
