import type { GitHubNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GitHubIcon } from "../../../icons";
import { Button } from "../../../ui/button";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { PromptPanel } from "./prompt-panel";
import { SourcesPanel } from "./sources-panel";
import { useConnectedSources } from "./sources/use-connected-sources";

export function GitHubNodePropertiesPanel({ node }: { node: GitHubNode }) {
	const { data, updateNodeData, setUiNodeState } = useWorkflowDesigner();
	const { startGeneration, isGenerating, stopGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "workspace", id: data.id },
	});
	const { all: connectedSources } = useConnectedSources(node);

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	const githubOperation = useCallback(() => {
		startGeneration({
			origin: {
				type: "workspace",
				id: data.id,
			},
			actionNode: node,
			sourceNodes: connectedSources.map(
				(connectedSource) => connectedSource.node,
			),
		});
	}, [connectedSources, data.id, node, startGeneration]);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<GitHubIcon className="size-[20px] text-black" />}
				name={node.name}
				fallbackName="GitHub"
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						loading={isGenerating}
						type="button"
						onClick={() => {
							if (isGenerating) {
								stopGeneration();
							} else {
								githubOperation();
							}
						}}
						className="w-[150px]"
					>
						{isGenerating ? (
							<span>Stop</span>
						) : (
							<>
								<span>Generate</span>
								<kbd className="flex items-center text-[12px]">
									<CommandIcon className="size-[12px]" />
									<CornerDownLeft className="size-[12px]" />
								</kbd>
							</>
						)}
					</Button>
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
			<KeyboardShortcuts
				generate={() => {
					if (!isGenerating) {
						githubOperation();
					}
				}}
			/>
		</PropertiesPanelRoot>
	);
}

export default GitHubNodePropertiesPanel;
