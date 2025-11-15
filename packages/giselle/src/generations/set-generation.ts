import type { Generation } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";

export async function setGeneration(args: {
	context: GiselleContext;
	generation: Generation;
}) {
	await internalSetGeneration({
		storage: args.context.storage,
		generation: args.generation,
		logger: args.context.logger,
	});
}
