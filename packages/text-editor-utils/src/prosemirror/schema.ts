import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

export interface SchemaOptions {
	includeSource?: boolean;
}

// Base node specifications
const baseNodes: { [name: string]: NodeSpec } = {
	doc: {
		content: "block+",
	},

	paragraph: {
		content: "inline*",
		group: "block",
		parseDOM: [{ tag: "p" }],
		toDOM() {
			return ["p", 0];
		},
	},

	text: {
		group: "inline",
	},

	bullet_list: {
		content: "list_item+",
		group: "block",
		parseDOM: [{ tag: "ul" }],
		toDOM() {
			return ["ul", 0];
		},
	},

	ordered_list: {
		content: "list_item+",
		group: "block",
		attrs: { order: { default: 1 } },
		parseDOM: [
			{
				tag: "ol",
				getAttrs(dom: HTMLElement) {
					return {
						order: dom.hasAttribute("start") ? +(dom.getAttribute("start") || "1") : 1,
					};
				},
			},
		],
		toDOM(node) {
			return node.attrs.order === 1
				? ["ol", 0]
				: ["ol", { start: node.attrs.order }, 0];
		},
	},

	list_item: {
		content: "paragraph block*",
		parseDOM: [{ tag: "li" }],
		toDOM() {
			return ["li", 0];
		},
		defining: true,
	},

	code_block: {
		content: "text*",
		marks: "",
		group: "block",
		code: true,
		defining: true,
		attrs: { language: { default: null } },
		parseDOM: [
			{
				tag: "pre",
				preserveWhitespace: "full",
				getAttrs: (node: HTMLElement) => ({
					language: node.getAttribute("data-language") || null,
				}),
			},
		],
		toDOM(node) {
			const attrs: Record<string, string> = {};
			if (node.attrs.language) {
				attrs["data-language"] = node.attrs.language;
			}
			return ["pre", attrs, ["code", 0]];
		},
	},
};

// Source node specification (optional)
export const sourceNodeSpec: NodeSpec = {
	group: "inline",
	inline: true,
	atom: true,
	attrs: {
		node: { default: null },
		outputId: { default: null },
	},
	parseDOM: [
		{
			tag: "span[data-node-id][data-output-id]",
			getAttrs: (dom: HTMLElement) => {
				const nodeId = dom.getAttribute("data-node-id");
				const outputId = dom.getAttribute("data-output-id");
				if (!nodeId || !outputId) return false;

				return {
					node: { id: nodeId },
					outputId,
				};
			},
		},
	],
	toDOM(node) {
		return [
			"span",
			{
				"data-node-id": node.attrs.node?.id,
				"data-output-id": node.attrs.outputId,
			},
			`{{${node.attrs.node?.id}:${node.attrs.outputId}}}`,
		];
	},
};

// Mark specifications
const marks: { [name: string]: MarkSpec } = {
	strong: {
		parseDOM: [
			{ tag: "strong" },
			{
				tag: "b",
				getAttrs: (node: HTMLElement) => node.style.fontWeight !== "normal" && null,
			},
			{
				style: "font-weight",
				getAttrs: (value: string) =>
					/^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
			},
		],
		toDOM() {
			return ["strong", 0];
		},
	},

	em: {
		parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }],
		toDOM() {
			return ["em", 0];
		},
	},

	strike: {
		parseDOM: [
			{ tag: "s" },
			{ tag: "strike" },
			{ style: "text-decoration=line-through" },
		],
		toDOM() {
			return ["s", 0];
		},
	},

	code: {
		parseDOM: [{ tag: "code" }],
		toDOM() {
			return ["code", 0];
		},
	},
};

export function createSchema(options: SchemaOptions = {}): Schema {
	const nodes = { ...baseNodes };

	// Conditionally add Source node
	if (options.includeSource) {
		nodes.Source = sourceNodeSpec;
	}

	return new Schema({
		nodes,
		marks,
	});
}
