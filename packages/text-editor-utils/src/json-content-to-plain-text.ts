import { generateText } from "@tiptap/core";
import type { JSONContent } from "@tiptap/react";
import { extensions, SourceExtension } from "./extensions";

export function jsonContentToPlainText(jsonContent: JSONContent): string {
	return generateText(jsonContent, [...extensions, SourceExtension]);
}
