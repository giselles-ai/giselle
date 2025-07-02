import type { JSONContent } from "@tiptap/react";

/**
 * @todo make more safe
 */
export function isJsonContent(args: unknown): args is JSONContent {
	let candidate = args;
	if (typeof args === "string") {
		try {
			candidate = JSON.parse(args);
		} catch (_error) {
			return false;
		}
	}
	return (
		typeof candidate === "object" && candidate !== null && "type" in candidate
	);
}
