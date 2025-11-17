import type { GiselleContext } from "../types";

export function getLanguageModelProviders(args: { context: GiselleContext }) {
	return args.context.llmProviders;
}
