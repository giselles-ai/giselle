import { Select } from "@giselle-internal/ui/select";
import type { Node, Workspace } from "@giselle-sdk/data-type";
import {
	isImageGenerationNode,
	isTextGenerationNode,
	type Output,
	OutputId,
	type TextGenerationNode,
	type ToolSet,
} from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import {
	anthropicLanguageModels,
	googleLanguageModels,
	openaiLanguageModels,
	Tier,
	TierAccess,
} from "@giselle-sdk/language-model";
import clsx from "clsx/lite";
import { Tabs } from "radix-ui";
import { useCallback, useEffect } from "react";
import { InputPanel } from "./input-panel";
import {
	AnthropicModelPanel,
	GoogleModelPanel,
	OpenAIModelPanel,
} from "./model";
import { createDefaultModelData, updateModelId } from "./model-defaults";
import { PromptPanel } from "./prompt-panel";
import { ToolsPanel } from "./tools";

interface TextGenerationTabContentProps {
	node: TextGenerationNode;
	uiState: { tab?: string } | undefined;
	setUiNodeState: (
		nodeId: string,
		state: { tab: string },
		options: { save: boolean },
	) => void;
	updateNodeDataContent: <T extends Node>(
		node: T,
		content: Partial<T["content"]>,
	) => void;
	updateNodeData: <T extends Node>(node: T, data: Partial<T>) => void;
	data: Workspace;
	deleteConnection: (connectionId: `cnnc-${string}`) => void;
}

export function TextGenerationTabContent({
	node,
	uiState,
	setUiNodeState,
	updateNodeDataContent,
	updateNodeData,
	data,
	deleteConnection,
}: TextGenerationTabContentProps) {
	const usageLimits = useUsageLimits();
	const userTier = usageLimits?.featureTier ?? Tier.enum.free;
	const accessibleTiers = TierAccess[userTier];

	// Get all models for current provider, with disabled state for Pro models when user is on free tier
	const getAvailableModels = useCallback((): Array<{
		value: string;
		label: string;
		disabled?: boolean;
		tier?: "free" | "pro";
	}> => {
		const prepareModelsWithTierInfo = (
			models: Array<{ id: string; tier: "free" | "pro" }>,
		) => {
			return models.map((model) => ({
				value: model.id,
				label: model.id,
				disabled: !accessibleTiers.includes(model.tier),
				tier: model.tier,
			}));
		};

		switch (node.content.llm.provider) {
			case "openai":
				return prepareModelsWithTierInfo(openaiLanguageModels);
			case "anthropic":
				return prepareModelsWithTierInfo(anthropicLanguageModels);
			case "google":
				return prepareModelsWithTierInfo(googleLanguageModels);
			default:
				return [];
		}
	}, [accessibleTiers, node.content.llm.provider]);

	// Check if current model is accessible to the user
	const getCurrentModelInfo = useCallback(() => {
		switch (node.content.llm.provider) {
			case "openai":
				return openaiLanguageModels.find((m) => m.id === node.content.llm.id);
			case "anthropic":
				return anthropicLanguageModels.find(
					(m) => m.id === node.content.llm.id,
				);
			case "google":
				return googleLanguageModels.find((m) => m.id === node.content.llm.id);
			default:
				return null;
		}
	}, [node.content.llm.provider, node.content.llm.id]);

	// Auto-switch to a compatible model if current one is not accessible
	useEffect(() => {
		const currentModel = getCurrentModelInfo();
		if (currentModel && !accessibleTiers.includes(currentModel.tier)) {
			// Find the first available (non-disabled) model for this provider
			const availableModels = getAvailableModels();
			const compatibleModel = availableModels.find((model) => !model.disabled);
			if (compatibleModel) {
				const updatedModel = updateModelId(
					node.content.llm,
					compatibleModel.value,
				);
				updateNodeDataContent(node, {
					...node.content,
					llm: updatedModel,
				});
			}
		}
	}, [
		accessibleTiers,
		node,
		updateNodeDataContent,
		getAvailableModels,
		getCurrentModelInfo,
	]); // Re-run when dependencies change

	return (
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
				<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content
				value="prompt"
				className="flex-1 flex flex-col overflow-hidden outline-none"
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
								const validProvider = provider as
									| "openai"
									| "anthropic"
									| "google";

								const defaultModel = createDefaultModelData(validProvider);

								updateNodeDataContent(node, {
									...node.content,
									llm: defaultModel,
									tools: {}, // Reset tools when changing provider
								});
							}}
							options={[
								{ value: "openai", label: "OpenAI" },
								{ value: "anthropic", label: "Anthropic" },
								{ value: "google", label: "Google" },
							]}
						/>
					</fieldset>

					<fieldset className="flex flex-col min-w-0">
						<label htmlFor="model" className="text-text text-[13px] mb-[2px]">
							Model
						</label>
						<Select
							id="model"
							placeholder="Select a model"
							value={node.content.llm.id}
							widthClassName="w-full"
							onValueChange={(modelId) => {
								const updatedModel = updateModelId(node.content.llm, modelId);

								updateNodeDataContent(node, {
									...node.content,
									llm: updatedModel,
								});
							}}
							options={getAvailableModels()}
							renderOption={(option) => (
								<span className={option.disabled ? "opacity-50" : ""}>
									{option.label}
								</span>
							)}
						/>
					</fieldset>
				</div>
				{node.content.llm.provider === "openai" && (
					<OpenAIModelPanel
						openaiLanguageModel={node.content.llm}
						tools={node.content.tools}
						onModelChange={(value) =>
							updateNodeDataContent(node, {
								...node.content,
								llm: value,
							})
						}
						onToolChange={(changedTool) =>
							updateNodeDataContent(node, {
								...node.content,
								tools: changedTool,
							})
						}
						onWebSearchChange={(enable) => {
							if (node.content.llm.provider !== "openai") {
								return;
							}
							const updateTools: ToolSet = {
								...node.content.tools,
								openaiWebSearch: enable
									? {
											searchContextSize: "medium",
										}
									: undefined,
							};
							const hasSourceOutput = node.outputs.some(
								(o) => o.accessor === "source",
							);
							const updateOutputs: Output[] = enable
								? hasSourceOutput
									? node.outputs
									: [
											...node.outputs,
											{
												id: OutputId.generate(),
												label: "Source",
												accessor: "source",
											},
										]
								: node.outputs.filter((output) => output.accessor !== "source");
							if (!enable) {
								const sourceOutput = node.outputs.find(
									(output) => output.accessor === "source",
								);
								if (sourceOutput) {
									for (const connection of data.connections) {
										if (connection.outputId !== sourceOutput.id) {
											continue;
										}
										deleteConnection(connection.id);

										const connectedNode = data.nodes.find(
											(node) => node.id === connection.inputNode.id,
										);
										if (connectedNode === undefined) {
											continue;
										}
										if (connectedNode.type === "operation") {
											switch (connectedNode.content.type) {
												case "textGeneration":
												case "imageGeneration": {
													if (
														!isTextGenerationNode(connectedNode) &&
														!isImageGenerationNode(connectedNode)
													) {
														throw new Error(
															`Expected text generation or image generation node, got ${JSON.stringify(connectedNode)}`,
														);
													}
													updateNodeData(connectedNode, {
														inputs: connectedNode.inputs.filter(
															(input) => input.id !== connection.inputId,
														),
													});
													break;
												}
												case "trigger":
												case "action":
												case "query":
													break;
												default: {
													const _exhaustiveCheck: never =
														connectedNode.content.type;
													throw new Error(
														`Unhandled node type: ${_exhaustiveCheck}`,
													);
												}
											}
										}
									}
								}
							}
							updateNodeData(node, {
								...node,
								content: {
									...node.content,
									tools: updateTools,
								},
								outputs: updateOutputs,
							});
						}}
					/>
				)}
				{node.content.llm.provider === "google" && (
					<GoogleModelPanel
						googleLanguageModel={node.content.llm}
						onSearchGroundingConfigurationChange={(enable) => {
							if (node.content.llm.provider !== "google") {
								return;
							}
							if (enable) {
								updateNodeData(node, {
									...node,
									content: {
										...node.content,
										llm: {
											...node.content.llm,
											configurations: {
												...node.content.llm.configurations,
												searchGrounding: enable,
											},
										},
									},
									outputs: ((): Output[] => {
										const hasSourceOutput = node.outputs.some(
											(o) => o.accessor === "source",
										);
										return hasSourceOutput
											? node.outputs
											: [
													...node.outputs,
													{
														id: OutputId.generate(),
														label: "Source",
														accessor: "source",
													},
												];
									})(),
								});
							} else {
								const sourceOutput = node.outputs.find(
									(output) => output.accessor === "source",
								);
								if (sourceOutput) {
									for (const connection of data.connections) {
										if (connection.outputId !== sourceOutput.id) {
											continue;
										}
										deleteConnection(connection.id);

										const connectedNode = data.nodes.find(
											(node) => node.id === connection.inputNode.id,
										);
										if (connectedNode === undefined) {
											continue;
										}
										if (connectedNode.type === "operation") {
											switch (connectedNode.content.type) {
												case "textGeneration":
													if (!isTextGenerationNode(connectedNode)) {
														throw new Error(
															`Expected text generation node, got ${JSON.stringify(connectedNode)}`,
														);
													}
													updateNodeData(connectedNode, {
														inputs: connectedNode.inputs.filter(
															(input) => input.id !== connection.inputId,
														),
													});
													break;
												case "imageGeneration": {
													if (!isImageGenerationNode(connectedNode)) {
														throw new Error(
															`Expected image generation node, got ${JSON.stringify(connectedNode)}`,
														);
													}
													updateNodeData(connectedNode, {
														inputs: connectedNode.inputs.filter(
															(input) => input.id !== connection.inputId,
														),
													});
													break;
												}
												case "trigger":
												case "action":
												case "query":
													break;
												default: {
													const _exhaustiveCheck: never =
														connectedNode.content.type;
													throw new Error(
														`Unhandled node type: ${_exhaustiveCheck}`,
													);
												}
											}
										}
									}
								}
								updateNodeData(node, {
									...node,
									content: {
										...node.content,
										llm: {
											...node.content.llm,
											configurations: {
												...node.content.llm.configurations,
												searchGrounding: false,
											},
										},
									},
									outputs: node.outputs.filter(
										(output) => output.accessor !== "source",
									),
								});
							}
						}}
						onModelChange={(value) =>
							updateNodeDataContent(node, {
								...node.content,
								llm: value,
							})
						}
					/>
				)}
				{node.content.llm.provider === "anthropic" && (
					<AnthropicModelPanel
						anthropicLanguageModel={node.content.llm}
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
				className="flex-1 flex flex-col overflow-y-auto outline-none"
			>
				<InputPanel node={node} />
			</Tabs.Content>
			<Tabs.Content
				value="tools"
				className="flex-1 flex flex-col overflow-y-auto p-[4px] gap-[16px] outline-none"
			>
				<ToolsPanel node={node} />
			</Tabs.Content>
		</Tabs.Root>
	);
}
