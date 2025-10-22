import type { TextNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizableSection,
	ResizableSectionGroup,
} from "../ui";

export function TextNodePropertiesPanel({ node }: { node: TextNode }) {
	const { updateNodeDataContent, updateNodeData } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				node={node}
				description={"Plain Text"}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
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
