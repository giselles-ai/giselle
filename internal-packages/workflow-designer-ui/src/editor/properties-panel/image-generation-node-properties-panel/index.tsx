import { useToasts } from "@giselle-internal/ui/toast";
import type { ImageGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { NodeIcon } from "../../../icons/node";
import { Button } from "../../../ui/button";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { KeyboardShortcuts } from "../../components/keyboard-shortcuts";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizeHandle,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import { FalModelPanel, OpenAIImageModelPanel } from "./models";
import { PromptPanel } from "./prompt-panel";
import { useConnectedSources } from "./sources";

export function ImageGenerationNodePropertiesPanel({
	node,
}: {
	node: ImageGenerationNode;
}) {
	const { data, updateNodeDataContent, updateNodeData, setUiNodeState } =
		useWorkflowDesigner();
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId: data.id },
		});
	const { all: connectedSources } = useConnectedSources(node);
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	const generateImage = useCallback(() => {
		if (usageLimitsReached) {
			error("Please upgrade your plan to continue using this feature.");
			return;
		}

		createAndStartGenerationRunner({
			origin: {
				type: "studio",
				workspaceId: data.id,
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
		createAndStartGenerationRunner,
		usageLimitsReached,
		error,
	]);

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<PropertiesPanelHeader
				icon={<NodeIcon node={node} className="size-[20px] text-black-900" />}
				node={node}
				description={node.content.llm.provider}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						type="button"
						disabled={usageLimitsReached}
						loading={isGenerating}
						onClick={() => {
							if (isGenerating) {
								stopGenerationRunner();
							} else {
								generateImage();
							}
						}}
						className="w-[150px] disabled:cursor-not-allowed disabled:opacity-50"
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

			<PanelGroup direction="vertical" className="flex-1 flex flex-col">
				<Panel>
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
									"flex gap-[16px] text-[14px] font-accent",
									"**:p-[4px] **:border-b **:cursor-pointer",
									"**:data-[state=active]:text-white-900 **:data-[state=active]:border-white-900",
									"**:data-[state=inactive]:text-black-400 **:data-[state=inactive]:border-transparent",
								)}
							>
								<Tabs.Trigger value="prompt">Prompt</Tabs.Trigger>
								<Tabs.Trigger value="model">Model</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content
								value="prompt"
								className="flex-1 flex flex-col overflow-hidden"
							>
								<PromptPanel node={node} />
							</Tabs.Content>
							<Tabs.Content
								value="model"
								className="flex-1 flex flex-col overflow-y-auto"
							>
								{node.content.llm.provider === "fal" && (
									<FalModelPanel
										languageModel={node.content.llm}
										onModelChange={(value) =>
											updateNodeDataContent(node, {
												...node.content,
												llm: value,
											})
										}
									/>
								)}
								{node.content.llm.provider === "openai" && (
									<OpenAIImageModelPanel
										languageModel={node.content.llm}
										onModelChange={(value) =>
											updateNodeDataContent(node, {
												...node.content,
												llm: value,
											})
										}
									/>
								)}
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
				<PanelResizeHandle className="h-[12px] flex items-center justify-center cursor-row-resize">
					<ResizeHandle direction="vertical" />
				</PanelResizeHandle>
				<Panel>
					<PropertiesPanelContent>
						<GenerationPanel
							node={node}
							onClickGenerateButton={generateImage}
						/>
					</PropertiesPanelContent>
				</Panel>
			</PanelGroup>
			<KeyboardShortcuts
				generate={() => {
					if (!isGenerating) {
						generateImage();
					}
				}}
			/>
		</PropertiesPanelRoot>
	);
}
