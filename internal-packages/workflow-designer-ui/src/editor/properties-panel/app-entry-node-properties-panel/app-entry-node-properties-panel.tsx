import { useWorkflowDesigner } from "@giselles-ai/giselle/react";
import type { AppEntryNode } from "@giselles-ai/protocol";
import { NodePanelHeader, PropertiesPanelRoot } from "../ui";

export function AppEntryNodePropertiesPanel({ node }: { node: AppEntryNode }) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/trigger-node"
				onDelete={() => deleteNode(node.id)}
			/>
		</PropertiesPanelRoot>
	);
}
