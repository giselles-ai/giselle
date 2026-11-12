import type { JSONContent } from "@tiptap/react";
import TurndownService from "turndown";
import { generateHTML } from "#tiptap-html";
import { extensions, SourceExtension } from "./extensions";

export function jsonContentToText(jsonContent: JSONContent) {
	const html = generateHTML(jsonContent, [...extensions, SourceExtension]);
	const turndownService = new TurndownService();
	return turndownService.turndown(html);
}
