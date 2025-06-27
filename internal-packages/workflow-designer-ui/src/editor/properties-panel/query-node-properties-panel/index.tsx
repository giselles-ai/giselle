import type { QueryNode } from "@giselle-sdk/data-type";
import {
	useFeatureFlag,
	useNodeGenerations,
	useWorkflowDesigner,
} from "giselle-sdk/react";
import { CommandIcon, CornerDownLeft, DatabaseZapIcon } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Button } from "../../../ui/button";
import { KeyboardShortcuts } from "../../components/keyboard-shortcuts";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizableSection,
	ResizableSectionGroup,
	ResizableSectionHandle,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import { QueryPanel } from "./query-panel";
import { useConnectedSources } from "./sources";

export function QueryNodePropertiesPanel({ node }: { node: QueryNode }) {
	const { data, updateNodeData } = useWorkflowDesigner();
	const { createAndStartGeneration, isGenerating, stopGeneration } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "workspace", id: data.id },
		});
	const { all: connectedSources } = useConnectedSources(node);
	const { layoutV2 } = useFeatureFlag();

	const generate = useCallback(() => {
		createAndStartGeneration({
			origin: {
				type: "workspace",
				id: data.id,
			},
			operationNode: node,
			sourceNodes: connectedSources.map(
				(connectedSource) => connectedSource.node,
			),
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		connectedSources,
		data.id,
		data.connections,
		node,
		createAndStartGeneration,
	]);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<DatabaseZapIcon className="size-[20px] text-black-900" />}
				node={node}
				description="Query"
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						type="button"
						onClick={() => {
							if (isGenerating) {
								stopGeneration();
							} else {
								generate();
							}
						}}
						className="w-[150px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isGenerating ? (
							<span>Stop</span>
						) : (
							<>
								<span>Query</span>
								<kbd className="flex items-center text-[12px]">
									<CommandIcon className="size-[12px]" />
									<CornerDownLeft className="size-[12px]" />
								</kbd>
							</>
						)}
					</Button>
				}
			/>

			<PropertiesPanelContent>
				{layoutV2 ? (
					<ResizableSectionGroup>
						<ResizableSection title="Query" defaultSize={50} minSize={20}>
							<div className="p-4">
								<Tabs.Root
									className="flex flex-col gap-[8px] h-full"
									defaultValue="query"
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
							</div>
						</ResizableSection>
						<ResizableSectionHandle />
						<ResizableSection title="Generation" defaultSize={50} minSize={20}>
							<div className="p-4">
								<GenerationPanel node={node} onClickGenerateButton={generate} />
							</div>
						</ResizableSection>
					</ResizableSectionGroup>
				) : (
					<PanelGroup direction="vertical" className="flex-1 flex flex-col">
						<Panel defaultSize={50} minSize={20}>
							<Tabs.Root
								className="flex flex-col gap-[8px] h-full"
								defaultValue="query"
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
						</Panel>
						<PanelResizeHandle className="h-[3px] bg-black-700/50 data-[resize-handle-state=drag]:bg-black-600 transition-colors duration-100 ease-in-out" />
						<Panel defaultSize={50} minSize={20}>
							<GenerationPanel node={node} onClickGenerateButton={generate} />
						</Panel>
					</PanelGroup>
				)}
			</PropertiesPanelContent>
			<KeyboardShortcuts
				generate={() => {
					if (!isGenerating) {
						generate();
					}
				}}
			/>
		</PropertiesPanelRoot>
	);
}
