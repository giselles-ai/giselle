import type { VectorStoreNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { NodeIcon } from "../../../icons/node";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GitHubVectorStoreNodePropertiesPanel } from "./github";

export function VectorStoreNodePropertiesPanel({
	node,
}: {
	node: VectorStoreNode;
}) {
	const { updateNodeData } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<NodeIcon node={node} className="size-[20px] text-black-900" />}
				node={node}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>
				<PropertiesPanel node={node} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function PropertiesPanel({ node }: { node: VectorStoreNode }) {
	const provider = node.content.source.provider;
	switch (provider) {
		case "github":
			return <GitHubVectorStoreNodePropertiesPanel node={node} />;
		case "githubPullRequest":
			// TODO: Implement dedicated GitHub PR vector store properties panel
			return <GitHubVectorStoreNodePropertiesPanel node={node} />;
		default: {
			const _exhaustiveCheck: never = provider;
			throw new Error(`Unhandled vector store provider: ${provider}`);
		}
	}
}
