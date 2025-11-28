import type { AppEntryNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { useState } from "react";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { AppEntryConfigurationView } from "./app-entry-configuration-view";
import { AppEntryConfiguredView } from "./app-entry-configured-view";

export function AppEntryNodePropertiesPanel({ node }: { node: AppEntryNode }) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
	const [scrollMode] = useState<"limited" | "full">("full");

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/trigger-node"
				onDelete={() => deleteNode(node.id)}
				readonly
			/>
			<PropertiesPanelContent>
				<div
					className={clsx(
						"relative custom-scrollbar overflow-y-auto",
						scrollMode === "limited" ? "max-h-[560px]" : "h-full flex-1",
					)}
				>
					{node.content.status === "unconfigured" && (
						<AppEntryConfigurationView
							draftApp={node.content.draftApp}
							node={node}
						/>
					)}
					{node.content.status === "configured" && (
						<AppEntryConfiguredView node={node} appId={node.content.appId} />
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
