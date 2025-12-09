import type { AppEntryNode } from "@giselles-ai/protocol";
import { useGiselle, useWorkflowDesigner } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { useState } from "react";
import useSWR from "swr";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { AppEntryConfiguredView } from "./app-entry-configured-view";

export function AppEntryNodePropertiesPanel({ node }: { node: AppEntryNode }) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
	const [scrollMode] = useState<"limited" | "full">("full");

	const giselle = useGiselle();
	const { data, isLoading } = useSWR(
		node.content.status !== "configured"
			? null
			: { namespace: "getApp", appId: node.content.appId },
		({ appId }) => giselle.getApp({ appId }),
	);

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
					{isLoading && <div>Loading...</div>}
					{data !== undefined && (
						<AppEntryConfiguredView node={node} app={data.app} />
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
