import type { NodeReference, OutputId } from "@giselle-sdk/data-type";
import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";

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
	};
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
