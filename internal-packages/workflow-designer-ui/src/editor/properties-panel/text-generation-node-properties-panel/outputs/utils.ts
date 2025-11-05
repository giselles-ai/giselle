import type { NodeBase } from "@giselles-ai/protocol";
import type { OutputWithDetails } from "./types";

export function filterInputs<T extends NodeBase>(
	inputs: OutputWithDetails[],
	guardFn: (args: unknown) => args is T,
): OutputWithDetails<T>[] {
	const tmpInputs: OutputWithDetails<T>[] = [];
	for (const input of inputs) {
		if (!guardFn(input.node)) {
			continue;
		}
		tmpInputs.push({
			...input,
			node: input.node,
		});
	}
	return tmpInputs;
}
