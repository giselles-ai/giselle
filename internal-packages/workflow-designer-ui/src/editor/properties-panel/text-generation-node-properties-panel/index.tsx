import { OutputId, type TextGenerationNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import {
	AnthropicIcon,
	GoogleIcon,
	OpenaiIcon,
	PerplexityIcon,
} from "../../../icons";
import { Button } from "../../../ui/button";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import {
	AnthropicModelPanel,
	GoogleModelPanel,
	OpenAIModelPanel,
	PerplexityModelPanel,
} from "./model";
import { PromptPanel } from "./prompt-panel";
import { useConnectedSources } from "./sources";
import { SourcesPanel } from "./sources-panel";

export function TextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const {
		data,
		updateNodeDataContent,
		updateNodeData,
		setUiNodeState,
		deleteConnection,
	} = useWorkflowDesigner();
	const { startGeneration, isGenerating, stopGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "workspace", id: data.id },
	});
	const { all: connectedSources } = useConnectedSources(node);
	const usageLimitsReached = useUsageLimitsReached();

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	const generateText = useCallback(() => {
		if (usageLimitsReached) {
			return;
		}

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
	}, [connectedSources, data.id, node, startGeneration, usageLimitsReached]);

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<PropertiesPanelHeader
				icon={
					<>
						{node.content.llm.provider === "openai" && (
							<OpenaiIcon className="size-[20px] text-black-900" />
						)}
						{node.content.llm.provider === "anthropic" && (
							<AnthropicIcon className="size-[20px] text-black-900" />
						)}
						{node.content.llm.provider === "google" && (
							<GoogleIcon className="size-[20px]" />
						)}
						{node.content.llm.provider === "perplexity" && (
							<PerplexityIcon className="size-[20px] text-black-900" />
						)}
					</>
				}
				name={node.name}
				fallbackName={node.content.llm.id}
				description={node.content.llm.provider}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						loading={isGenerating}
						type="button"
						disabled={usageLimitsReached}
						onClick={() => {
							if (isGenerating) {
								stopGeneration();
							} else {
								generateText();
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

			<PanelGroup
				direction="vertical"
				className="flex-1 flex flex-col gap-[16px]"
			>
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
								<Tabs.Trigger value="sources">Sources</Tabs.Trigger>
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
								{node.content.llm.provider === "openai" && (
									<OpenAIModelPanel
										openaiLanguageModel={node.content.llm}
										onModelChange={(value) =>
											updateNodeDataContent(node, {
												...node.content,
												llm: value,
											})
										}
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
													outputs: [
														...node.outputs,
														{
															id: OutputId.generate(),
															label: "Source",
															accesor: "source",
														},
													],
												});
											} else {
												const sourceOutput = node.outputs.find(
													(output) => output.accesor === "source",
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
														if (connectedNode.type === "action") {
															switch (connectedNode.content.type) {
																case "textGeneration": {
																	updateNodeData(connectedNode, {
																		inputs: connectedNode.inputs.filter(
																			(input) =>
																				input.id !== connection.inputId,
																		),
																	});
																	break;
																}
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
														(output) => output.accesor !== "source",
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
								{node.content.llm.provider === "perplexity" && (
									<PerplexityModelPanel
										perplexityLanguageModel={node.content.llm}
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
								value="sources"
								className="flex-1 flex flex-col overflow-y-auto"
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
				<Panel>
					<PropertiesPanelContent>
						<GenerationPanel node={node} />
					</PropertiesPanelContent>
				</Panel>
			</PanelGroup>
			<KeyboardShortcuts
				generate={() => {
					if (!isGenerating) {
						generateText();
					}
				}}
			/>
		</PropertiesPanelRoot>
	);
}
