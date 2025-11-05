import type { NodeBase } from "@giselles-ai/protocol";
import type { Source } from "./types";

export function filterSources<T extends NodeBase>(
	sources: Source[],
	guardFn: (args: unknown) => args is T,
): Source<T>[] {
	const tmpSources: Source<T>[] = [];
	for (const source of sources) {
		if (!guardFn(source.node)) {
			continue;
		}
		tmpSources.push({
			...source,
			node: source.node,
		});
	}
	return tmpSources;
}
