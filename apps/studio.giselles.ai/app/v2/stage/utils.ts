import { type IconName, iconNames } from "lucide-react/dynamic";

export function isIconName(data: unknown): data is IconName {
	return typeof data === "string" && data in iconNames;
}
