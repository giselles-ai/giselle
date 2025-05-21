import type { QueryNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { DatabaseZapIcon } from "lucide-react";
import { Tabs } from "radix-ui";
import { useMemo } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { InputPanel } from "./input-panel";
import { QueryPanel } from "./query-panel";

export function QueryNodePropertiesPanel({ node }: { node: QueryNode }) {
	const { data, updateNodeData, setUiNodeState } = useWorkflowDesigner();

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<DatabaseZapIcon className="size-[20px] text-black-900" />}
				node={node}
				description="Query"
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>

			<PanelGroup direction="vertical" className="flex-1 flex flex-col">
				<Panel>
					<PropertiesPanelContent>
						<Tabs.Root
							className="flex flex-col gap-[8px] h-full"
							value={uiState?.tab ?? "query"}
							onValueChange={(tab) => {
								setUiNodeState(node.id, { tab }, { save: true });
							}}
						>
							<Tabs.List className="flex gap-[16px] text-[14px] font-accent **:p-[4px] **:border-b **:cursor-pointer **:data-[state=active]:text-white-900 **:data-[state=active]:border-white-900 **:data-[state=inactive]:text-black-400 **:data-[state=inactive]:border-transparent">
								<Tabs.Trigger value="query">Query</Tabs.Trigger>
								<Tabs.Trigger value="input">Input</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content
								value="query"
								className="flex-1 flex flex-col overflow-hidden"
							>
								<QueryPanel node={node} />
							</Tabs.Content>
							<Tabs.Content
								value="input"
								className="flex-1 flex flex-col overflow-y-auto"
							>
								<InputPanel node={node} />
							</Tabs.Content>
						</Tabs.Root>
					</PropertiesPanelContent>
				</Panel>
			</PanelGroup>
		</PropertiesPanelRoot>
	);
}
