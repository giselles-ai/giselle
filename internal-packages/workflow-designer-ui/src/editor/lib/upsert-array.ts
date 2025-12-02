export function upsertArray<T>(
	items: readonly T[],
	value: T,
	predicate: (item: T, index: number, array: readonly T[]) => boolean,
): T[] {
	const index = items.findIndex(predicate);

	if (index === -1) {
		return [...items, value];
	}

	return [...items.slice(0, index), value, ...items.slice(index + 1)];
}
