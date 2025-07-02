import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/react";
import TurndownService from "turndown";
import { extensions, SourceExtension } from "./extensions";

export function jsonContentToText(jsonContent: JSONContent) {
	const html = generateHTML(jsonContent, [...extensions, SourceExtension]);
	const turndownService = new TurndownService();
	return turndownService.turndown(html);
}
