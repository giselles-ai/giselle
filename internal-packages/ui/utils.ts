import { type IconName, iconNames } from "lucide-react/dynamic";

export function isIconName(data: unknown): data is IconName {
	if (typeof data !== "string") {
		return false;
	}

	const collection = iconNames as unknown;

	if (Array.isArray(collection)) {
		return collection.includes(data as IconName);
	}

	if (collection instanceof Set) {
		return (collection as Set<IconName>).has(data as IconName);
	}

	if (typeof collection === "object" && collection !== null) {
		return Object.hasOwn(collection, data);
	}

	return false;
}
