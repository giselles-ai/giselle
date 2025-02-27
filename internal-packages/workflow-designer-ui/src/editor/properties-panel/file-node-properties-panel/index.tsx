import type { FileNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { PdfFileIcon } from "../../../icons";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { FilePanel } from "./file-panel";

export function FileNodePropertiesPanel({ node }: { node: FileNode }) {
	const { updateNodeData } = useWorkflowDesigner();
	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<PdfFileIcon className="size-[20px] text-black-900" />}
				name={node.name}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>
				<FilePanel node={node} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
