import type { TriggerNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GitHubTriggerPropertiesPanel } from "./providers/github-trigger/github-trigger-properties-panel";
import { ManualTriggerPropertiesPanel } from "./providers/manual-trigger/manual-trigger-properties-panel";

export function TriggerNodePropertiesPanel({ node }: { node: TriggerNode }) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/trigger-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
					<PropertiesPanel node={node} />
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
function PropertiesPanel({ node }: { node: TriggerNode }) {
	switch (node.content.provider) {
		case "github":
			return <GitHubTriggerPropertiesPanel node={node} />;
		case "manual":
			return <ManualTriggerPropertiesPanel node={node} />;
		default: {
			const _exhaustiveCheck: never = node.content.provider;
			throw new Error(`Unhandled action: ${_exhaustiveCheck}`);
		}
	}
}
