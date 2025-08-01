import { Node as GiselleNode } from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/giselle/react";
import { SourceExtension } from "@giselle-sdk/text-editor-utils";
import {
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import clsx from "clsx/lite";
import { useMemo } from "react";

const Component = (props: NodeViewProps) => {
	const node = useMemo(() => {
		// Try storage first (updated by lifecycle hooks), then fallback to options
		let nodes = props.editor.storage.Source?.nodes;

		if (!nodes || nodes.length === 0) {
			// Fallback to extension options
			const sourceExtension = props.editor.extensionManager.extensions.find(
				(ext) => ext.name === "Source",
			);
			nodes = sourceExtension?.options?.nodes;
		}

		if (!nodes) {
			return undefined;
		}

		const parsedNodes = GiselleNode.array().parse(nodes);
		const foundNode = parsedNodes.find(
			(node) => node.id === props.node.attrs.node.id,
		);

		return foundNode;
	}, [props.editor, props.node.attrs.node]);

	const output = useMemo(
		() =>
			node?.outputs.find((output) => output.id === props.node.attrs.outputId),
		[node, props.node.attrs.outputId],
	);
	if (node === undefined || output === undefined) {
		return null;
	}

	return (
		<NodeViewWrapper className="inline">
			<span
				contentEditable={false}
				data-selected={props.selected}
				data-type={node.type}
				data-content-type={node.content.type}
				className={clsx(
					"rounded-[4px] px-[4px] py-[2px] border-[1px] transition-colors",
					"data-[content-type=textGeneration]:bg-generation-node-1/20 data-[content-type=textGeneration]:text-generation-node-1",
					"data-[content-type=github]:bg-github-node-1/20 data-[content-type=github]:text-github-node-1",
					"data-[content-type=text]:bg-text-node-1/20 data-[content-type=text]:text-text-node-1",
					"data-[content-type=file]:bg-file-node-1/20 data-[content-type=file]:text-file-node-1",
					"data-[content-type=webPage]:bg-webPage-node-1/20 data-[content-type=webPage]:text-webPage-node-1",
					"data-[content-type=action]:bg-action-node-1/20 data-[content-type=action]:text-action-node-1",
					"data-[content-type=trigger]:bg-trigger-node-1/20 data-[content-type=trigger]:text-trigger-node-1",
					"data-[content-type=query]:bg-query-node-1/20 data-[content-type=query]:text-query-node-1",
					"border-transparent data-[selected=true]:border-primary-900",
					"text-[12px]",
				)}
			>
				{defaultName(node)} / {output?.label}
			</span>
		</NodeViewWrapper>
	);
};

interface SourceExtensionReactOptions {
	nodes: GiselleNode[];
}
interface SourceExtensionReactStorage {
	nodes: GiselleNode[];
}

export const SourceExtensionReact = SourceExtension.extend<
	SourceExtensionReactOptions,
	SourceExtensionReactStorage
>({
	addOptions() {
		return {
			nodes: [],
		};
	},

	addStorage() {
		return {
			nodes: [],
		};
	},

	onBeforeCreate() {
		this.storage.nodes = this.options.nodes;
	},

	onCreate() {
		this.storage.nodes = this.options.nodes;
	},

	onUpdate() {
		this.storage.nodes = this.options.nodes;
	},

	addNodeView() {
		return ReactNodeViewRenderer(Component);
	},

	parseHTML() {
		return [
			{
				tag: "span[data-node-id][data-output-id]",
				getAttrs: (element) => {
					const nodeId = element.getAttribute("data-node-id");
					const outputId = element.getAttribute("data-output-id");
					if (!nodeId || !outputId) {
						return false;
					}

					const node = findRelatedNode(this.options, nodeId, outputId);
					if (!node) {
						return false;
					}

					return {
						node,
						outputId,
					};
				},
			},
		];
	},
});

function findRelatedNode(
	options: SourceExtensionReactOptions,
	nodeId: string,
	outputId: string,
) {
	return options.nodes.find(
		(node) =>
			node.id === nodeId &&
			node.outputs.some((output) => output.id === outputId),
	);
}
