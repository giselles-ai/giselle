import type { VectorStoreNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
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
	switch (node.content.source.provider) {
		case "github":
			return <GitHubVectorStoreNodePropertiesPanel node={node} />;
		default: {
			const _exhaustiveCheck: never = node.content.source.provider;
			throw new Error(`Unhandled vector store provider: ${_exhaustiveCheck}`);
		}
	}
}
