import type { IconName } from "lucide-react/dynamic";

// Runtime helper to narrow unknown values to Lucide IconName.
// The Lucide dynamic package exports a union type for IconName, but its
// runtime shape for iconNames is not guaranteed to be an array, so we keep
// the check intentionally simple and only guard on string-ness here.
export function isIconName(data: unknown): data is IconName {
	return typeof data === "string";
}
