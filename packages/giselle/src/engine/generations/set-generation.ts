import type { Generation } from "../../concepts";
import type { GiselleEngineContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";

export async function setGeneration(args: {
	context: GiselleEngineContext;
	generation: Generation;
}) {
	await internalSetGeneration({
		storage: args.context.storage,
		generation: args.generation,
		logger: args.context.logger,
	});
}
