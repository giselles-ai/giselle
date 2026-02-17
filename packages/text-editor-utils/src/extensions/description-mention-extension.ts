import type { JSONContent } from "@tiptap/core";
import { Node } from "@tiptap/core";

export interface DescriptionMentionJSONContent extends JSONContent {
	type: "descriptionMention";
	attrs: {
		id: string;
		label: string;
	};
}

export function createDescriptionMentionJSONContent(attrs: {
	id: string;
	label: string;
}): DescriptionMentionJSONContent {
	return {
		type: "descriptionMention",
		attrs,
	};
}

export const DescriptionMentionExtension = Node.create({
	name: "descriptionMention",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			id: { default: null },
			label: { default: null },
		};
	},

	renderHTML({ node }) {
		return [
			"span",
			{
				"data-type": "description-mention",
				"data-id": node.attrs.id,
			},
			node.attrs.label ?? "",
		];
	},

	renderText({ node }) {
		return node.attrs.label ?? "";
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-type="description-mention"]',
			},
		];
	},
});
