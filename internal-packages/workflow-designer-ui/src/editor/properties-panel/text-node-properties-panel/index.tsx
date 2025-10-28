import type { TextNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react";
import {
	PropertiesPanelContent,
	PropertiesPanelRoot,
	ResizableSection,
	ResizableSectionGroup,
} from "../ui";
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
				<ResizableSectionGroup>
					<ResizableSection defaultSize={100}>
						<TextEditor
							placeholder="Write or paste text here..."
							value={node.content.text}
							onValueChange={(text) => updateNodeDataContent(node, { text })}
						/>
					</ResizableSection>
				</ResizableSectionGroup>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
