import { useWorkflowDesigner } from "@giselles-ai/react";
import type { TextNode } from "@giselles-ai/protocol";
import { TextEditor } from "@giselles-ai/text-editor/react";
import { useRef } from "react";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";

export function TextNodePropertiesPanel({ node }: { node: TextNode }) {
	const { updateNodeDataContent, updateNodeData, deleteNode } =
		useWorkflowDesigner();

	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div ref={containerRef} className="flex flex-col min-h-0">
					<TextEditor
						placeholder="Write or paste text here..."
						value={node.content.text}
						onValueChange={(text) => updateNodeDataContent(node, { text })}
						showToolbar={false}
						editorClassName="bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] border-none !pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px] rounded-[8px] min-h-[120px]"
					/>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
