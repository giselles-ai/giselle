import type { GiselleEngineContext } from "../types";

export function getLanguageModelProviders(args: {
	context: GiselleEngineContext;
}) {
	return args.context.llmProviders;
}
