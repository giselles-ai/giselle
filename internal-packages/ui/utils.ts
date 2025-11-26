import { type IconName, iconNames } from "lucide-react/dynamic";

export function isIconName(data: unknown): data is IconName {
	if (typeof data !== "string") {
		return false;
	}

	// `iconNames` can be an array or an object depending on bundling/runtime.
	if (Array.isArray(iconNames)) {
		return iconNames.includes(data as IconName);
	}

	// Fallback for when iconNames is an object map
	return data in iconNames;
}
