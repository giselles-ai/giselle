import type { GiselleEngineContext } from "../contracts";

export function getLanguageModelProviders(args: {
	context: GiselleEngineContext;
}) {
	return args.context.llmProviders;
}
