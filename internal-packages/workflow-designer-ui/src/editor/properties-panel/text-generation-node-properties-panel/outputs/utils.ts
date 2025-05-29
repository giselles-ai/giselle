import type { NodeBase } from "@giselle-sdk/data-type";
import { filterNodeItems } from "../../common/filter-node-items";
import type { OutputWithDetails } from "./types";

export function filterInputs<T extends NodeBase>(
	inputs: OutputWithDetails[],
	guardFn: (args: unknown) => args is T,
): OutputWithDetails<T>[] {
	return filterNodeItems(inputs, guardFn);
}
