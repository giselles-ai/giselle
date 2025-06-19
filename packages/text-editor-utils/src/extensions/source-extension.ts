import type { NodeReference, OutputId } from "@giselle-sdk/data-type";
import type { JSONContent } from "@tiptap/core";
import { Node } from "@tiptap/core";

export interface SourceJSONContent extends JSONContent {
	type: "Source";
	attrs: {
		node: NodeReference;
		outputId: OutputId;
	};
}

export function createSourceExtensionJSONContent({
	node,
	outputId,
}: { node: NodeReference; outputId: OutputId }) {
	return {
		type: "Source",
		attrs: {
			node,
			outputId,
		},
	} satisfies SourceJSONContent;
}

export const SourceExtension = Node.create({
	name: "Source",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			node: {
				isRequired: true,
			},
			outputId: {
				isRequired: true,
			},
		};
	},
	renderHTML({ node }) {
		return [
			"span",
			{
				"data-node-id": node.attrs.node.id,
				"data-output-id": node.attrs.outputId,
			},
			`{{${node.attrs.node.id}:${node.attrs.outputId}}}`,
		];
	},
});
