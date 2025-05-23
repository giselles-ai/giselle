import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Document from "@tiptap/extension-document";
import History from "@tiptap/extension-history";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
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
	Document,
	Paragraph,
	Bold,
	ListItem,
	BulletList,
	Code,
	CodeBlockLowlight.configure({
		lowlight,
	}),
	Italic,
	OrderedList,
	Strike,
	Text,
	History,
];
