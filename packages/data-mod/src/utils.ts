export function getValueAtPath(
	// biome-ignore lint/suspicious/noExplicitAny: adjust any object
	obj: any,
	path: PropertyKey[],
) {
	return path.reduce(
		(acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
		obj,
	);
}

export function setValueAtPath(
	// biome-ignore lint/suspicious/noExplicitAny: adjust any object
	obj: any,
	path: PropertyKey[],
	// biome-ignore lint/suspicious/noExplicitAny: adjust any object
	value: any,
) {
	if (path.length === 0) return;

	const lastKey = path[path.length - 1];
	const parentPath = path.slice(0, -1);

	let parent = obj;
	for (const key of parentPath) {
		if (key === "__proto__" || key === "constructor" || key === "prototype") {
			return;
		}
		if (parent[key] === undefined) {
			parent[key] = typeof key === "number" ? [] : {};
		}
		parent = parent[key];
	}

	if (
		lastKey === "__proto__" ||
		lastKey === "constructor" ||
		lastKey === "prototype"
	) {
		return;
	}
	parent[lastKey] = value;
}

export function isObject(input: unknown): input is object {
	return typeof input === "object" && input !== null;
}
