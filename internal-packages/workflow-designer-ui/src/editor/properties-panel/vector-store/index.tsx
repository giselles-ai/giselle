import type { VectorStoreNode } from "@giselle-ai/data-type";
import { useWorkflowDesigner } from "@giselle-ai/giselle/react";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";
import { DocumentVectorStoreNodePropertiesPanel } from "./document";
import { GitHubVectorStoreNodePropertiesPanel } from "./github";

export function VectorStoreNodePropertiesPanel({
	node,
}: {
	node: VectorStoreNode;
}) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/github-vector-store-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<PropertiesPanel node={node} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function PropertiesPanel({ node }: { node: VectorStoreNode }) {
	switch (node.content.source.provider) {
		case "document":
			return <DocumentVectorStoreNodePropertiesPanel node={node} />;
		default:
			return <GitHubVectorStoreNodePropertiesPanel node={node} />;
	}
}
