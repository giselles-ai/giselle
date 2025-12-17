import type { App, AppEntryNode } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { useState } from "react";
import useSWR from "swr";
import { useGiselle } from "../../../app-designer/store/giselle-client-provider";
import {
	useDeleteNode,
	useUpdateNodeData,
} from "../../../app-designer";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { AppEntryConfiguredView } from "./app-entry-configured-view";

export function AppEntryNodePropertiesPanel({ node }: { node: AppEntryNode }) {
	const updateNodeData = useUpdateNodeData();
	const deleteNode = useDeleteNode();
	const [scrollMode] = useState<"limited" | "full">("full");

	const giselle = useGiselle();
	const { data, isLoading, mutate } = useSWR(
		node.content.status !== "configured"
			? null
			: { namespace: "getApp", appId: node.content.appId },
		({ appId }: { appId: App["id"] }) => giselle.getApp({ appId }),
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
						<AppEntryConfiguredView
							node={node}
							app={data.app}
							mutateApp={mutate}
						/>
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
