import type { GitHubNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { GitHubIcon } from "../../../icons";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";

export function GitHubNodePropertiesPanel({ node }: { node: GitHubNode }) {
	const { updateNodeData } = useWorkflowDesigner();
	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<GitHubIcon className="size-[20px] text-black" />}
				name={node.name}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>
				<h1>sample</h1>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
