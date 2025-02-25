import type { GitHubNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import {
	useGenerationController,
	useWorkflowDesigner,
} from "giselle-sdk/react";
import { Tabs } from "radix-ui";
import { useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GitHubIcon } from "../../../icons";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { PromptPanel } from "./prompt-panel";
import { SourcesPanel } from "./sources-panel";

export function GitHubNodePropertiesPanel({ node }: { node: GitHubNode }) {
	const { updateNodeData, data, setUiNodeState } = useWorkflowDesigner();
	const { startGeneration } = useGenerationController();
	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	// 接続されたソースを取得
	const connectedSources = useMemo(() => {
		const sources = [];
		const connectionsToThisNode = data.connections.filter(
			(connection) => connection.inputNodeId === node.id,
		);

		for (const connection of connectionsToThisNode) {
			const sourceNode = data.nodes.find(
				(node) => node.id === connection.outputNodeId,
			);
			if (sourceNode) {
				sources.push(sourceNode);
			}
		}

		return sources;
	}, [data.connections, data.nodes, node.id]);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<GitHubIcon className="size-[20px] text-black" />}
				name={node.name}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<button
						type="button"
						className="flex gap-[4px] justify-center items-center bg-blue rounded-[8px] px-[15px] py-[8px] text-white text-[14px] font-[700] cursor-pointer"
						onClick={() => {
							startGeneration({
								origin: {
									type: "workspace",
									id: data.id,
								},
								actionNode: node,
								sourceNodes: connectedSources,
							});
						}}
					>
						Generate
					</button>
				}
			/>

			<PanelGroup
				direction="vertical"
				className="flex-1 flex flex-col gap-[16px]"
			>
				<Panel defaultSize={70} minSize={30}>
					<PropertiesPanelContent>
						<Tabs.Root
							className="flex flex-col gap-[8px] h-full"
							value={uiState?.tab ?? "prompt"}
							onValueChange={(tab) => {
								setUiNodeState(node.id, { tab }, { save: true });
							}}
						>
							<Tabs.List
								className={clsx(
									"flex gap-[16px] text-[14px]",
									"**:p-[4px] **:border-b **:cursor-pointer",
									"**:data-[state=active]:text-white **:data-[state=active]:border-white",
									"**:data-[state=inactive]:text-black-400 **:data-[state=inactive]:border-transparent",
								)}
							>
								<Tabs.Trigger value="prompt">Prompt</Tabs.Trigger>
								<Tabs.Trigger value="sources">Sources</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content
								value="prompt"
								className="flex-1 flex flex-col h-full min-h-[300px]"
							>
								<PromptPanel node={node} />
							</Tabs.Content>
							<Tabs.Content
								value="sources"
								className="flex-1 flex flex-col h-full min-h-[300px]"
							>
								<SourcesPanel node={node} />
							</Tabs.Content>
						</Tabs.Root>
					</PropertiesPanelContent>
				</Panel>
				<PanelResizeHandle
					className={clsx(
						"h-[1px] bg-black-400/50 transition-colors",
						"data-[resize-handle-state=hover]:bg-black-400 data-[resize-handle-state=drag]:bg-black-400",
					)}
				/>
				<Panel defaultSize={30} minSize={20}>
					<PropertiesPanelContent>
						<GenerationPanel node={node} />
					</PropertiesPanelContent>
				</Panel>
			</PanelGroup>
		</PropertiesPanelRoot>
	);
}

export default GitHubNodePropertiesPanel;
