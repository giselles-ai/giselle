import { Node as GiselleNode } from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/node-utils";
import { 
	createSourceExtensionPlugin,
	updateSourceExtensionNodes 
} from "@giselle-sdk/text-editor-utils";
import { EditorView, NodeView } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import clsx from "clsx/lite";
import React from "react";
import { createRoot, Root } from "react-dom/client";

interface SourceNodeViewProps {
	node: PMNode;
	view: EditorView;
	getPos: () => number;
	selected: boolean;
}

function SourceNodeComponent({ node, view, getPos, selected }: SourceNodeViewProps) {
	// For now, we'll use a simple implementation without getting nodes from state
	const nodeId = node.attrs.node?.id;
	const outputId = node.attrs.outputId;

	if (!nodeId || !outputId) {
		return null;
	}

	return (
		<span
			contentEditable={false}
			data-selected={selected}
			className={clsx(
				"rounded-[4px] px-[4px] py-[2px] border-[1px] transition-colors",
				"bg-primary-900/20 text-primary-900",
				"border-transparent data-[selected=true]:border-primary-900",
				"text-[12px]",
			)}
		>
			{nodeId} / {outputId}
		</span>
	);
}

class SourceNodeView implements NodeView {
	dom: HTMLElement;
	contentDOM?: HTMLElement;
	private root: Root;

	constructor(
		private node: PMNode,
		private view: EditorView,
		private getPos: () => number | undefined
	) {
		this.dom = document.createElement("span");
		this.dom.className = "source-node-view";
		this.root = createRoot(this.dom);
		this.updateComponent();
	}

	private updateComponent() {
		const pos = this.getPos();
		const selected = pos !== undefined && 
						 this.view.state.selection.from <= pos && 
						 pos < this.view.state.selection.to;

		this.root.render(
			React.createElement(SourceNodeComponent, {
				node: this.node,
				view: this.view,
				getPos: () => pos || 0,
				selected,
			})
		);
	}

	update(node: PMNode): boolean {
		if (node.type !== this.node.type) {
			return false;
		}
		
		this.node = node;
		this.updateComponent();
		return true;
	}

	selectNode() {
		this.updateComponent();
	}

	deselectNode() {
		this.updateComponent();
	}

	destroy() {
		this.root.unmount();
	}
}

export function createSourceNodeView(node: PMNode, view: EditorView, getPos: () => number | undefined): NodeView {
	return new SourceNodeView(node, view, getPos);
}

export interface SourceExtensionReactOptions {
	nodes: GiselleNode[];
}

export function createSourceExtensionReact(options: SourceExtensionReactOptions) {
	return createSourceExtensionPlugin({
		nodes: options.nodes,
	});
}

export function updateSourceNodes(view: EditorView, nodes: GiselleNode[]) {
	updateSourceExtensionNodes(view, nodes);
}