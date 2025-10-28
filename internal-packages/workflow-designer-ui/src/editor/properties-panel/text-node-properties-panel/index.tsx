import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import type { TextNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";

export function TextNodePropertiesPanel({ node }: { node: TextNode }) {
	const { updateNodeDataContent, updateNodeData, deleteNode } =
		useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div className="flex flex-col">
					<div className="overflow-y-auto">
						<PromptEditor
							placeholder="Write or paste text here..."
							value={node.content.text}
							onValueChange={(text) => updateNodeDataContent(node, { text })}
							nodes={[]}
							connectedSources={[]}
							showToolbar={false}
							variant="plain"
							showExpandIcon={false}
						/>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
