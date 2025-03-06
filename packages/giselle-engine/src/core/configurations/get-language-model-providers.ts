import type { GiselleEngineContext } from "../types";

export async function getLanguageModelProviders(args: {
	context: GiselleEngineContext;
}) {
	return args.context.llmProviders;
}
