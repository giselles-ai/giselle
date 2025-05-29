import {
	DOMParser,
	DOMSerializer,
	Node as PMNode,
	type Schema,
} from "prosemirror-model";
import TurndownService from "turndown";
import { createSchema } from "./schema";

export interface ProseMirrorJSONContent {
	type: string;
	attrs?: Record<string, unknown>;
	content?: ProseMirrorJSONContent[];
	marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
	text?: string;
}

export interface ConversionOptions {
	schema?: Schema;
}

class ProseMirrorConverter {
	private schema: Schema;
	private domSerializer: DOMSerializer;
	private domParser: DOMParser;

	constructor(options: ConversionOptions = {}) {
		this.schema = options.schema || createSchema();
		this.domSerializer = DOMSerializer.fromSchema(this.schema);
		this.domParser = DOMParser.fromSchema(this.schema);
	}

	// Convert ProseMirror document to JSON
	public toJSON(doc: PMNode): ProseMirrorJSONContent {
		return doc.toJSON();
	}

	// Convert JSON to ProseMirror document
	public fromJSON(json: ProseMirrorJSONContent): PMNode {
		return PMNode.fromJSON(this.schema, json);
	}

	// Convert ProseMirror document to HTML
	public toHTML(doc: PMNode): string {
		const fragment = this.domSerializer.serializeFragment(doc.content);
		const div = document.createElement("div");
		div.appendChild(fragment);
		return div.innerHTML;
	}

	// Convert HTML to ProseMirror document
	public fromHTML(html: string): PMNode {
		const div = document.createElement("div");
		div.innerHTML = html;
		return this.domParser.parse(div);
	}

	// Convert ProseMirror document to plain text (markdown-like)
	public toText(doc: PMNode): string {
		const html = this.toHTML(doc);
		const turndownService = new TurndownService({
			headingStyle: "atx",
			bulletListMarker: "-",
			codeBlockStyle: "fenced",
		});

		// Add custom rule for Source nodes
		turndownService.addRule("source", {
			filter: (node: Node) => {
				const element = node as Element;
				return (
					element.nodeName === "SPAN" &&
					element.hasAttribute("data-node-id") &&
					element.hasAttribute("data-output-id")
				);
			},
			replacement: (content: string, node: Node) => {
				const element = node as Element;
				const nodeId = element.getAttribute("data-node-id");
				const outputId = element.getAttribute("data-output-id");
				return `{{${nodeId}:${outputId}}}`;
			},
		});

		return turndownService.turndown(html);
	}

	// Convert text content to ProseMirror document
	public fromText(text: string): PMNode {
		const lines = text.split("\n");
		const content: PMNode[] = [];

		for (const line of lines) {
			if (line.trim() === "") {
				content.push(this.schema.node("paragraph"));
			} else {
				content.push(
					this.schema.node("paragraph", null, [this.schema.text(line)]),
				);
			}
		}

		if (content.length === 0) {
			content.push(this.schema.node("paragraph"));
		}

		return this.schema.node("doc", null, content);
	}

	// Check if content is valid JSON
	public isValidJSON(content: unknown): boolean {
		if (typeof content === "string") {
			try {
				const parsed = JSON.parse(content);
				return this.isValidProseMirrorJSON(parsed);
			} catch {
				return false;
			}
		}

		return this.isValidProseMirrorJSON(content);
	}

	private isValidProseMirrorJSON(obj: unknown): obj is ProseMirrorJSONContent {
		return (
			typeof obj === "object" &&
			obj !== null &&
			"type" in obj &&
			typeof (obj as Record<string, unknown>).type === "string"
		);
	}
}

// Global converter instance
const converter = new ProseMirrorConverter();

// Export convenience functions
export function jsonContentToText(jsonContent: ProseMirrorJSONContent): string {
	try {
		const doc = converter.fromJSON(jsonContent);
		return converter.toText(doc);
	} catch (error) {
		console.error("Failed to convert JSON content to text:", error);
		return "";
	}
}

export function htmlToJSON(html: string): ProseMirrorJSONContent | null {
	try {
		const doc = converter.fromHTML(html);
		return converter.toJSON(doc);
	} catch (error) {
		console.error("Failed to convert HTML to JSON:", error);
		return null;
	}
}

export function jsonToHTML(json: ProseMirrorJSONContent): string {
	try {
		const doc = converter.fromJSON(json);
		return converter.toHTML(doc);
	} catch (error) {
		console.error("Failed to convert JSON to HTML:", error);
		return "";
	}
}

export function isJsonContent(args: unknown): args is ProseMirrorJSONContent {
	return converter.isValidJSON(args);
}

// Export the converter class and create function
export { ProseMirrorConverter };
export function createConverter(
	options?: ConversionOptions,
): ProseMirrorConverter {
	return new ProseMirrorConverter(options);
}
