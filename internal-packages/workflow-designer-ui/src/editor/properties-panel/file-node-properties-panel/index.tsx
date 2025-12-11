import type { FileCategory, FileNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";
import { FilePanel } from "./file-panel";
import type { FileTypeConfig } from "./file-panel-type";

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
		accept: ["image/png", "image/jpeg", "image/gif", "image/svg+xml"],
		label: "Image",
	},
};

export function FileNodePropertiesPanel({ node }: { node: FileNode }) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/file-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<FilePanel node={node} config={fileType[node.content.category]} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
