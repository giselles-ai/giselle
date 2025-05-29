import type { NodeBase } from "@giselle-sdk/data-type";

export function filterNodeItems<
	T extends NodeBase,
	I extends { node: NodeBase },
>(
	items: I[],
	guardFn: (value: unknown) => value is T,
): (Omit<I, "node"> & { node: T })[] {
	const filtered: (Omit<I, "node"> & { node: T })[] = [];
	for (const item of items) {
		if (!guardFn(item.node)) {
			continue;
		}
		filtered.push({ ...(item as I), node: item.node });
	}
	return filtered;
}
