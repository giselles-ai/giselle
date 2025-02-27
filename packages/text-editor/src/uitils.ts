import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/react";
import TurndownService from "turndown";
import { SourceExtension, extensions } from "./extensions";

/**
 * @todo make more safe
 */
export function isJsonContent(args: unknown): args is JSONContent {
	let candidate = args;
	if (typeof args === "string") {
		try {
			candidate = JSON.parse(args);
		} catch (error) {
			return false;
		}
	}
	return (
		typeof candidate === "object" && candidate !== null && "type" in candidate
	);
}

export function jsonContentToText(jsonContent: JSONContent) {
	const html = generateHTML(jsonContent, [...extensions, SourceExtension]);
	const turndownService = new TurndownService();
	return turndownService.turndown(html);
}
