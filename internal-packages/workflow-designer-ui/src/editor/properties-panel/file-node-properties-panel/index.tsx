import type { FileCategory, FileNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { FileNodeIcon } from "../../../icons/node";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { FilePanel, type FileTypeConfig } from "./file-panel";

const fileType: Record<FileCategory, FileTypeConfig> = {
	pdf: {
		accept: ["application/pdf"],
		label: "PDF",
	},
	text: {
		accept: ["text/plain", "text/markdown"],
		label: "Text",
	},
	image: {
		accept: ["image/png", "image/jpeg", "image/gif", "image/svg"],
		label: "Image",
		maxSize: 1024 * 1024,
	},
};

export function FileNodePropertiesPanel({ node }: { node: FileNode }) {
	const { updateNodeData } = useWorkflowDesigner();
	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={
					<FileNodeIcon node={node} className="size-[20px] text-black-900" />
				}
				name={node.name}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>
				<FilePanel node={node} config={fileType[node.content.category]} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
