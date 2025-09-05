import { Select } from "@giselle-internal/ui/select";
import { useToasts } from "@giselle-internal/ui/toast";
import type { ImageGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import {
	falLanguageModels,
	openaiImageModels,
} from "@giselle-sdk/language-model";
import clsx from "clsx/lite";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { NodeIcon } from "../../../icons/node";
import { Button } from "../../../ui/button";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizeHandle,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import { createDefaultModelData, updateModelId } from "./model-defaults";
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

	// Get available models for current provider
	const getAvailableModels = (): Array<{ value: string; label: string }> => {
		switch (node.content.llm.provider) {
			case "fal":
				return falLanguageModels.map((model) => ({
					value: model.id,
					label: model.id,
				}));
			case "openai":
				return openaiImageModels.map((model) => ({
					value: model.id,
					label: model.id,
				}));
			default:
				return [];
		}
	};

	useKeyboardShortcuts({
		onGenerate: () => {
			if (!isGenerating) {
				generateImage();
			}
		},
	});

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
								className="flex-1 flex flex-col overflow-y-auto px-[4px] outline-none"
							>
								<div className="grid grid-cols-2 gap-[16px] mb-[16px] max-w-full border-b border-white-400/20 pb-[16px]">
									<fieldset className="flex flex-col min-w-0">
										<label
											htmlFor="provider"
											className="text-text text-[13px] mb-[2px]"
										>
											Provider
										</label>
										<Select
											id="provider"
											placeholder="Select a provider"
											value={node.content.llm.provider}
											onValueChange={(provider) => {
												const validProvider = provider as "fal" | "openai";
												const defaultModel =
													createDefaultModelData(validProvider);

												updateNodeDataContent(node, {
													...node.content,
													llm: defaultModel,
												});
											}}
											options={[
												{ value: "fal", label: "Fal" },
												{ value: "openai", label: "OpenAI" },
											]}
										/>
									</fieldset>

									<fieldset className="flex flex-col min-w-0">
										<label
											htmlFor="model"
											className="text-text text-[13px] mb-[2px]"
										>
											Model
										</label>
										<Select
											id="model"
											placeholder="Select a model"
											value={node.content.llm.id}
											widthClassName="w-full"
											onValueChange={(modelId) => {
												const updatedModel = updateModelId(
													node.content.llm,
													modelId,
												);

												updateNodeDataContent(node, {
													...node.content,
													llm: updatedModel,
												});
											}}
											options={getAvailableModels()}
										/>
									</fieldset>
								</div>
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
		</PropertiesPanelRoot>
	);
}
