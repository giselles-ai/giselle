import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { Popover } from "@giselle-internal/ui/popover";
import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import { SettingDetail } from "@giselle-internal/ui/setting-label";
import {
	getEntry,
	type LanguageModelId,
	type LanguageModelTool,
	languageModelTools,
} from "@giselles-ai/language-model-registry";
import { defaultName } from "@giselles-ai/node-registry";
import { type ContentGenerationNode, Node } from "@giselles-ai/protocol";
import { useNodeGenerations, useWorkflowDesigner } from "@giselles-ai/react";
import { titleCase } from "@giselles-ai/utils";
import clsx from "clsx/lite";
import {
	MoveUpIcon,
	PlusIcon,
	Settings2Icon,
	SquareIcon,
	XIcon,
} from "lucide-react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { useCallback, useMemo, useState } from "react";
import { GenerationView } from "../../../ui/generation-view";
import { GenerateCtaButton, NodePanelHeader, PropertiesPanelRoot } from "../ui";
import { ConfigurationFormField, ModelPickerV2 } from "./language-model";
import { useNodeContext } from "./node-context/use-node-context";
import { ToolConfigurationDialog } from "./tool";

export function ContentGenerationNodePropertiesPanel({
	node,
}: {
	node: ContentGenerationNode;
}) {
	const { updateNodeData, updateNodeDataContent, deleteNode, data } =
		useWorkflowDesigner();
	const languageModel = useMemo(
		() => getEntry(node.content.languageModel.id),
		[node.content.languageModel.id],
	);

	function isDefaultConfigKey(
		k: string,
	): k is keyof typeof languageModel.defaultConfiguration {
		return k in languageModel.defaultConfiguration;
	}

	const [selectedToolName, setSelectedToolName] = useState<string | null>(null);
	const [selectedToolConfig, setSelectedToolConfig] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [toolDialogOpen, setToolDialogOpen] = useState(false);

	const selectedTool = useMemo(() => {
		if (!selectedToolName) return null;
		return (
			languageModelTools.find(
				(tool: LanguageModelTool) => tool.name === selectedToolName,
			) ?? null
		);
	}, [selectedToolName]);

	// Get configured tools from node
	const configuredTools = useMemo(() => {
		const tools =
			(
				node.content as {
					tools?: { name: string; configuration: Record<string, unknown> }[];
				}
			).tools ?? [];
		return tools.map((tool) => {
			const toolDef = languageModelTools.find(
				(t: LanguageModelTool) => t.name === tool.name,
			);
			return {
				name: tool.name,
				title: toolDef?.title ?? tool.name,
				configuration: tool.configuration,
				hasConfigurationOptions:
					toolDef && Object.keys(toolDef.configurationOptions).length > 0,
			};
		});
	}, [node.content]);

	const toolsGroupByProvider = useMemo(
		() => [
			{
				groupId: "giselle",
				groupLabel: "Hosted",
				items: languageModelTools
					.filter((tool: LanguageModelTool) => tool.provider === "giselle")
					.map((tool: LanguageModelTool) => ({
						value: tool.name,
						label: tool?.title ?? tool.name,
					})),
			},
			{
				groupId: languageModel.provider,
				groupLabel: `${titleCase(languageModel.provider)} Provides`,
				items: languageModelTools
					.filter(
						(tool: LanguageModelTool) =>
							tool.provider === languageModel.provider,
					)
					.map((tool: LanguageModelTool) => ({
						value: tool.name,
						label: tool?.title ?? tool.name,
					})),
			},
		],
		[languageModel.provider],
	);

	const handleToolSelect = (_e: unknown, item: { value: string }) => {
		const toolName = item.value;

		const tool = languageModelTools.find(
			(t: LanguageModelTool) => t.name === toolName,
		);
		// If tool has no configuration options, add it immediately without dialog
		if (tool && Object.keys(tool.configurationOptions).length === 0) {
			handleToolConfigSubmit(toolName);
			return;
		}

		// Otherwise, open dialog for configuration
		setSelectedToolName(toolName);
		setSelectedToolConfig(null);
		setToolDialogOpen(true);
	};

	const handleToolEdit = (
		toolName: string,
		config: Record<string, unknown>,
	) => {
		setSelectedToolName(toolName);
		setSelectedToolConfig(config);
		setToolDialogOpen(true);
	};

	const handleToolDelete = (toolName: string) => {
		const existingTools =
			(
				node.content as {
					tools?: { name: string; configuration: Record<string, unknown> }[];
				}
			).tools ?? [];
		const updatedTools = existingTools.filter((tool) => tool.name !== toolName);

		updateNodeData(node, {
			content: {
				...node.content,
				tools: updatedTools,
			} as typeof node.content,
		});
	};

	const handleToolConfigSubmit = (
		toolName: string,
		config: Record<string, unknown> = {},
	) => {
		// Transform to content-generation.ts tools format
		const toolEntry = {
			name: toolName,
			configuration: config,
		};

		// Get existing tools array or create new one
		const existingTools =
			(node.content as { tools?: (typeof toolEntry)[] }).tools ?? [];

		// Check if tool already exists, update it; otherwise add new one
		const toolIndex = existingTools.findIndex(
			(tool: typeof toolEntry) => tool.name === selectedToolName,
		);

		const updatedTools =
			toolIndex >= 0
				? existingTools.map((tool: typeof toolEntry, index: number) =>
						index === toolIndex ? toolEntry : tool,
					)
				: [...existingTools, toolEntry];

		// Update node with new tools array
		updateNodeData(node, {
			content: {
				...node.content,
				tools: updatedTools,
			} as typeof node.content,
		});

		setToolDialogOpen(false);
		setSelectedToolName(null);
	};

	const handleToolDialogOpenChange = (open: boolean) => {
		setToolDialogOpen(open);
		if (!open) {
			setSelectedToolName(null);
			setSelectedToolConfig(null);
		}
	};

	const {
		shouldShowOutputLabel,
		connections,
		availableContextNodes,
		handleContextSelect,
	} = useNodeContext(node);

	const isPromptEmpty = useMemo(() => {
		if (typeof node.content.prompt !== "string") {
			return true;
		}
		if (node.content.prompt.length === 0) {
			return true;
		}
		try {
			const json = JSON.parse(node.content.prompt);
			const paragraph = json.content?.[0];
			if (paragraph === undefined) {
				return true;
			}
			if (paragraph?.content === undefined) {
				return true;
			}
			if (paragraph.content.length === 0) {
				return true;
			}
		} catch {
			return true;
		}

		return false;
	}, [node.content.prompt]);

	const {
		createAndStartGenerationRunner,
		isGenerating,
		stopGenerationRunner,
		currentGeneration,
	} = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});
	const handleModelChange = useCallback(
		(modelId: LanguageModelId) => {
			const newLanguageModel = getEntry(modelId);
			updateNodeData(node, {
				content: {
					...node.content,
					languageModel: {
						provider: newLanguageModel.provider,
						id: newLanguageModel.id,
						configuration: newLanguageModel.defaultConfiguration,
					},
				},
			});
		},
		[node, updateNodeData],
	);

	const handleGenerationButtonClick = useCallback(() => {
		if (isGenerating) {
			stopGenerationRunner();
			return;
		}
		createAndStartGenerationRunner({
			origin: {
				type: "studio",
				workspaceId: data.id,
			},
			operationNode: node,
			sourceNodes: connections
				.map((connection) => connection.outputNode)
				.filter((nodeLike) => {
					const result = Node.safeParse(nodeLike);
					return result.success;
				}) as Node[],
			connections: connections.map((connection) => ({
				id: connection.id,
				inputId: connection.input.id,
				inputNode: connection.inputNode,
				outputId: connection.output.id,
				outputNode: connection.outputNode,
			})),
		});
	}, [
		createAndStartGenerationRunner,
		data.id,
		node,
		connections,
		isGenerating,
		stopGenerationRunner,
	]);

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>

			<div className="overflow-hidden flex flex-col grow-1">
				<div className="grid grid-cols-[60px_1fr] gap-y-[12px] gap-x-[12px] items-start mb-[12px]">
					<SettingDetail size="md" className="text-text-muted">
						Model
					</SettingDetail>
					<div className="overflow-x-hidden">
						<div className="flex items-center gap-[4px]">
							<ModelPickerV2
								value={node.content.languageModel.id}
								onChange={handleModelChange}
							/>
							<Popover
								onOpenAutoFocus={(e) => {
									e.preventDefault();
								}}
								trigger={
									<button
										type="button"
										className="w-[30px] h-[28px] hover:bg-element-hover cursor-pointer flex items-center justify-center rounded-[4px]"
									>
										<Settings2Icon className="size-[14px] shrink-0" />
									</button>
								}
								widthClassName="w-[300px]"
								sideOffset={10}
								align="end"
							>
								<div className="flex flex-col gap-[20px] p-[12px]">
									{Object.entries(languageModel.configurationOptions).map(
										([key, option]) => {
											// Ensure the key is valid using our type guard
											if (!isDefaultConfigKey(key)) {
												console.warn(
													`Configuration key ${key} not found in default configuration`,
												);
												return null;
											}

											const currentValue =
												node.content.languageModel.configuration[key] ??
												languageModel.defaultConfiguration[key];
											return (
												<ConfigurationFormField
													key={key}
													name={key}
													option={option}
													value={currentValue}
													defaultValue={languageModel.defaultConfiguration[key]}
													onValueChange={(value) => {
														updateNodeData(node, {
															content: {
																...node.content,
																languageModel: {
																	...node.content.languageModel,
																	configuration: {
																		...node.content.languageModel.configuration,
																		[key]: value,
																	},
																},
															},
														});
													}}
												/>
											);
										},
									)}
								</div>
							</Popover>
						</div>
						{Object.keys(node.content.languageModel.configuration).length >
							0 && (
							<div className="text-[12px] text-inverse flex flex-wrap items-center gap-2 mt-[2px]">
								{Object.entries(node.content.languageModel.configuration).map(
									([key, value]) => (
										<span key={key} className="text-text-secondary flex gap-1">
											<span>{key}:</span>
											<span className="text-info-500">{String(value)}</span>
										</span>
									),
								)}
							</div>
						)}
					</div>

					<SettingDetail size="md" className="text-text-muted">
						Context
					</SettingDetail>
					<div className="flex flex-wrap gap-[6px]">
						{connections.map((connection) => (
							<div
								key={connection.output.id}
								className="flex items-center gap-[4px] px-[8px] py-[4px] bg-surface rounded-full text-[12px] text-text"
							>
								{shouldShowOutputLabel(connection.outputNode.id)
									? `${defaultName(connection.outputNode)}:${connection.output.label}`
									: defaultName(connection.outputNode)}
							</div>
						))}
						{availableContextNodes.length > 0 && (
							<DropdownMenu
								items={availableContextNodes}
								onSelect={handleContextSelect}
								trigger={
									<button
										type="button"
										className="flex items-center gap-[4px] px-[8px] py-[4px] bg-surface rounded-full text-[12px] text-text hover:bg-element-hover cursor-pointer"
									>
										<PlusIcon className="size-[12px]" />
										<span>Add</span>
									</button>
								}
								modal={false}
							/>
						)}
						{connections.length === 0 && availableContextNodes.length === 0 && (
							<div className="text-[12px] text-text-muted">
								Create a node to add context
							</div>
						)}
					</div>

					<SettingDetail size="md" className="text-text-muted">
						Tools
					</SettingDetail>
					<div className="flex flex-col gap-[8px]">
						<div className="flex flex-wrap gap-[6px]">
							{configuredTools.map((tool) => (
								<div
									key={tool.name}
									className="flex items-center gap-[4px] px-[8px] py-[4px] bg-surface rounded-full text-[12px] text-text group"
								>
									{tool.hasConfigurationOptions ? (
										<button
											type="button"
											className="hover:text-text-primary cursor-pointer"
											onClick={() =>
												handleToolEdit(tool.name, tool.configuration)
											}
										>
											{tool.title}
										</button>
									) : (
										<TooltipPrimitive.Provider>
											<TooltipPrimitive.Root delayDuration={100}>
												<TooltipPrimitive.Trigger asChild>
													<button
														type="button"
														className="hover:text-text-primary cursor-pointer"
													>
														{tool.title}
													</button>
												</TooltipPrimitive.Trigger>
												<TooltipPrimitive.Portal>
													<TooltipPrimitive.Content
														side="top"
														align="center"
														className={clsx(
															"group z-50 overflow-hidden rounded-md px-4 py-4 text-[12px] shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[300px]",
															"bg-surface text-inverse",
														)}
														sideOffset={8}
													>
														This tool has no configuration
													</TooltipPrimitive.Content>
												</TooltipPrimitive.Portal>
											</TooltipPrimitive.Root>
										</TooltipPrimitive.Provider>
									)}
									<button
										type="button"
										className="cursor-pointer"
										onClick={() => handleToolDelete(tool.name)}
									>
										<XIcon className="size-[12px]" />
									</button>
								</div>
							))}
							<DropdownMenu
								items={toolsGroupByProvider}
								onSelect={(e, option) => {
									handleToolSelect(e, { value: String(option.value) });
								}}
								trigger={
									<button
										type="button"
										className="flex items-center gap-[4px] px-[8px] py-[4px] bg-surface rounded-full text-[12px] text-text hover:bg-element-hover cursor-pointer"
									>
										<PlusIcon className="size-[12px]" />
										<span>Add</span>
									</button>
								}
								modal={false}
							/>
						</div>
						{selectedTool && (
							<ToolConfigurationDialog
								tool={selectedTool}
								open={toolDialogOpen}
								onOpenChange={handleToolDialogOpenChange}
								onSubmit={handleToolConfigSubmit}
								currentConfig={selectedToolConfig ?? undefined}
								trigger={null}
							/>
						)}
					</div>
				</div>

				<div className="flex gap-[8px] flex-1 overflow-hidden">
					<div className="w-1/2 flex flex-col relative">
						<SettingDetail size="md" className="text-text-muted mb-[6px]">
							Prompt
						</SettingDetail>
						<PromptEditor
							placeholder="Write your prompt... Use @ to reference other nodes"
							value={node.content.prompt}
							onValueChange={(value) => {
								updateNodeDataContent(node, { prompt: value });
							}}
							connections={connections}
							containerClassName="flex-1"
						/>
					</div>
					<div className="flex flex-col w-1/2">
						<SettingDetail size="md" className="text-text-muted mb-[6px]">
							Output
						</SettingDetail>
						<div className="rounded-md bg-surface/70 w-full flex-1 p-[8px] overflow-y-auto">
							{currentGeneration ? (
								<GenerationView generation={currentGeneration} />
							) : (
								<p className="text-text-muted text-[14px]">
									Your generation will appear here
								</p>
							)}
						</div>
					</div>
				</div>
				<div className="py-[8px]">
					<GenerateCtaButton
						isGenerating={isGenerating}
						isEmpty={isPromptEmpty}
						onClick={handleGenerationButtonClick}
					/>
				</div>
			</div>
		</PropertiesPanelRoot>
	);
}
