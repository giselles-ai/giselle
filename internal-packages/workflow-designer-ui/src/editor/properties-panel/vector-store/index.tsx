import { useWorkflowDesigner } from "@giselles-ai/giselle/react";
import type { VectorStoreNode } from "@giselles-ai/protocol";
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
				docsUrl={
					node.content.source.provider === "document"
						? "https://docs.giselles.ai/en/glossary/document-vector-store-node"
						: "https://docs.giselles.ai/en/glossary/github-vector-store-node"
				}
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
