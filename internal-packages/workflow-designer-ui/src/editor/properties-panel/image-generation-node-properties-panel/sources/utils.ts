import type { NodeBase } from "@giselle-sdk/data-type";
import { filterNodeItems } from "../../common/filter-node-items";
import type { Source } from "./types";

export function filterSources<T extends NodeBase>(
	sources: Source[],
	guardFn: (args: unknown) => args is T,
): Source<T>[] {
	return filterNodeItems(sources, guardFn);
}
