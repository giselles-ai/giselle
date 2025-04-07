import { OutputId, type TextGenerationNode } from "@giselle-sdk/data-type";
import { isJsonContent, jsonContentToText } from "@giselle-sdk/text-editor";
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
import { useToasts } from "../../../ui/toast";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import {
	AnthropicModelPanel,
	GoogleModelPanel,
	OpenAIModelPanel,
	PerplexityModelPanel,
} from "./model";
import { PromptPanel } from "./prompt-panel";
import { useConnectedSources } from "./sources";

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
	const { error } = useToasts();

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	const generateText = useCallback(() => {
		if (usageLimitsReached) {
			error("Please upgrade your plan to continue using this feature.");
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
	}, [
		connectedSources,
		data.id,
		node,
		startGeneration,
		usageLimitsReached,
		error,
	]);

	const jsonOrText = node.content.prompt;
	const text = isJsonContent(jsonOrText)
		? jsonContentToText(JSON.parse(jsonOrText))
		: jsonOrText;
	const noWhitespaceText = text?.replace(/[\s\u3000]+/g, "");
	const disabled = usageLimitsReached || !noWhitespaceText;

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
				node={node}
				description={node.content.llm.provider}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						loading={isGenerating}
						type="button"
						disabled={disabled}
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
								<Tabs.Trigger value="input">Input</Tabs.Trigger>
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
															accessor: "source",
														},
													],
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
														if (connectedNode.type === "action") {
															switch (connectedNode.content.type) {
																case "textGeneration":
																case "imageGeneration": {
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
																		connectedNode.content;
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
								value="input"
								className="flex-1 flex flex-col overflow-y-auto"
							>
								<InputPanel node={node} />
							</Tabs.Content>
						</Tabs.Root>
					</PropertiesPanelContent>
				</Panel>
				<PanelResizeHandle
					className={clsx(
						"h-[12px] flex items-center justify-center cursor-row-resize",
						"after:content-[''] after:h-[3px] after:w-[32px] after:bg-[#3a3f44] after:rounded-full",
						"hover:after:bg-[#4a90e2]",
					)}
				/>
				<Panel>
					<PropertiesPanelContent>
						<GenerationPanel node={node} onClickGenerateButton={generateText} />
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
