import type { Node, Workspace } from "@giselle-sdk/data-type";
import {
	isImageGenerationNode,
	isTextGenerationNode,
	type Output,
	OutputId,
	type TextGenerationNode,
	type ToolSet,
} from "@giselle-sdk/data-type";
import { useFeatureFlag } from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { Tabs } from "radix-ui";
import { InputPanel } from "./input-panel";
import {
	AnthropicModelPanel,
	GoogleModelPanel,
	OpenAIModelPanel,
	PerplexityModelPanel,
} from "./model";
import { PromptPanel } from "./prompt-panel";
import { GitHubToolsPanel, PostgresToolsPanel, ToolsPanel } from "./tools";

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
	githubTools: boolean;
	sidemenu: boolean;
}

export function TextGenerationTabContent({
	node,
	uiState,
	setUiNodeState,
	updateNodeDataContent,
	updateNodeData,
	data,
	deleteConnection,
	githubTools,
	sidemenu,
}: TextGenerationTabContentProps) {
	const { layoutV2 } = useFeatureFlag();
	return (
		<>
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
					{!layoutV2 && <Tabs.Trigger value="input">Input</Tabs.Trigger>}
					{githubTools && <Tabs.Trigger value="tools">Tools</Tabs.Trigger>}
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
								const updateOutputs: Output[] = enable
									? [
											...node.outputs,
											{
												id: OutputId.generate(),
												label: "Source",
												accessor: "source",
											},
										]
									: node.outputs.filter(
											(output) => output.accessor !== "source",
										);
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
					className="flex-1 flex flex-col overflow-y-auto outline-none"
				>
					<InputPanel node={node} />
				</Tabs.Content>
				<Tabs.Content
					value="tools"
					className="flex-1 flex flex-col overflow-y-auto p-[4px] gap-[16px] outline-none"
				>
					{sidemenu ? (
						<ToolsPanel node={node} />
					) : (
						<div className="p-[8px]">
							<GitHubToolsPanel node={node} />
							<PostgresToolsPanel node={node} />
						</div>
					)}
				</Tabs.Content>
			</Tabs.Root>
		</>
	);
}
