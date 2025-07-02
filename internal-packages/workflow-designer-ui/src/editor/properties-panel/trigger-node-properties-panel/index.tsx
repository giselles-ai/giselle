import type { TriggerNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { NodeIcon } from "../../../icons/node";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GitHubTriggerPropertiesPanel } from "./providers/github-trigger/github-trigger-properties-panel";
import { ManualTriggerPropertiesPanel } from "./providers/manual-trigger/manual-trigger-properties-panel";

export function TriggerNodePropertiesPanel({ node }: { node: TriggerNode }) {
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
