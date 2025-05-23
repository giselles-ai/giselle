import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import StarterKit from "@tiptap/starter-kit";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { createLowlight } from "lowlight";
export * from "./source-extension";

const lowlight = createLowlight();
lowlight.register("html", html);
lowlight.register("js", js);
lowlight.register("ts", ts);

export const extensions = [
	StarterKit.configure({
		blockquote: false,
		codeBlock: false,
		hardBreak: false,
		heading: false,
		horizontalRule: false,
		dropcursor: false,
		gapcursor: false,
	}),
	CodeBlockLowlight.configure({
		lowlight,
	}),
];
