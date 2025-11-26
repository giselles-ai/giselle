import { type IconName, iconNames } from "lucide-react/dynamic";

export function isIconName(data: unknown): data is IconName {
	if (typeof data !== "string") {
		return false;
	}

	// lucide-react/dynamic's iconNames can be an array or an object depending on bundler.
	if (Array.isArray(iconNames)) {
		return iconNames.includes(data as IconName);
	}

	if (iconNames != null && typeof iconNames === "object") {
		return data in (iconNames as Record<string, unknown>);
	}

	// Fallback: when we can't reliably inspect iconNames, accept any string.
	return true;
}
