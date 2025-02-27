import type { TextNode } from "@giselle-sdk/data-type";
import { TextEditor } from "@giselle-sdk/text-editor/react";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { PromptIcon } from "../../../icons";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";

export function TextNodePropertiesPanel({ node }: { node: TextNode }) {
	const { updateNodeDataContent, updateNodeData } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<PromptIcon className="size-[20px] text-black-900" />}
				name={node.name}
				fallbackName="Plain text"
				description={"Plain text"}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>
				<TextEditor
					value={node.content.text}
					onValueChange={(text) => updateNodeDataContent(node, { text })}
				/>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
