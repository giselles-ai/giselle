import type { NodeReference, OutputId } from "@giselle-sdk/data-type";
import { NodeSpec, type Node as PMNode, type Schema } from "prosemirror-model";
import { type EditorState, Plugin, PluginKey } from "prosemirror-state";
import { type EditorView, NodeView } from "prosemirror-view";

export interface SourceNodeAttrs {
	node: NodeReference;
	outputId: OutputId;
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
	};
}

// sourceNodeSpec is exported from schema.ts

export interface SourceExtensionOptions {
	nodes?: any[];
}

export interface SourceExtensionStorage {
	nodes: any[];
}

export const sourceExtensionKey = new PluginKey<SourceExtensionStorage>(
	"sourceExtension",
);

export function createSourceExtensionPlugin(
	options: SourceExtensionOptions = {},
): Plugin<SourceExtensionStorage> {
	return new Plugin<SourceExtensionStorage>({
		key: sourceExtensionKey,
		state: {
			init() {
				return {
					nodes: options.nodes || [],
				};
			},
			apply(tr, value, oldState, newState) {
				// Update nodes if they changed
				const meta = tr.getMeta(sourceExtensionKey);
				if (meta && meta.nodes) {
					return {
						...value,
						nodes: meta.nodes,
					};
				}
				return value;
			},
		},
	});
}

export function updateSourceExtensionNodes(
	view: EditorView,
	nodes: any[],
): void {
	const tr = view.state.tr;
	tr.setMeta(sourceExtensionKey, { nodes });
	view.dispatch(tr);
}

export function getSourceExtensionNodes(state: EditorState): any[] {
	const pluginState = sourceExtensionKey.getState(state);
	return pluginState?.nodes || [];
}

export function createSourceNode(
	schema: Schema,
	node: NodeReference,
	outputId: OutputId,
): PMNode {
	return schema.nodes.Source.create({ node, outputId });
}

export function insertSourceNode(
	view: EditorView,
	node: NodeReference,
	outputId: OutputId,
): boolean {
	const { state } = view;
	const { selection } = state;

	const sourceNode = createSourceNode(state.schema, node, outputId);
	const tr = state.tr.replaceSelectionWith(sourceNode);

	view.dispatch(tr);
	return true;
}

// Helper function to find a related node from the storage
export function findRelatedNode(
	nodes: any[],
	nodeId: string,
	outputId: string,
): any | null {
	return nodes.find(
		(node) =>
			node.id === nodeId &&
			node.outputs.some((output: any) => output.id === outputId),
	);
}
