import { Button } from "@giselle-internal/ui/button";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { Popover } from "@giselle-internal/ui/popover";
import { SettingDetail } from "@giselle-internal/ui/setting-label";
import {
	getEntry,
	type LanguageModelTool,
	languageModelTools,
} from "@giselles-ai/language-model-registry";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { titleCase } from "@giselles-ai/utils";
import { PlusIcon, Settings2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { ConfigurationFormField } from "./configuration-form-field";
import { ModelPickerV2 } from "./model-picker-v2";
import { ToolConfigurationDialog } from "./tool-configuration-dialog";

export function ContentGenerationNodePropertiesPanel({
	node,
}: {
	node: ContentGenerationNode;
}) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
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
	const [toolDialogOpen, setToolDialogOpen] = useState(false);

	const selectedTool = useMemo(() => {
		if (!selectedToolName) return null;
		return (
			languageModelTools.find(
				(tool: LanguageModelTool) => tool.name === selectedToolName,
			) ?? null
		);
	}, [selectedToolName]);

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
		setSelectedToolName(item.value);
		setToolDialogOpen(true);
	};

	const handleToolConfigSubmit = (config: Record<string, unknown>) => {
		if (!selectedToolName) {
			return;
		}

		// Transform to content-generation.ts tools format
		const toolEntry = {
			name: selectedToolName,
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

		console.log(updatedTools);
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
		}
	};

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>

			<PropertiesPanelContent>
				<div className="grid grid-cols-[80px_1fr] gap-y-[12px] gap-x-[12px] items-start">
					<SettingDetail size="md">Model</SettingDetail>
					<div className="overflow-x-hidden">
						<div className="flex items-center gap-[4px]">
							<ModelPickerV2 value={node.content.languageModel.id} />
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

					<SettingDetail size="md">Context</SettingDetail>
					<div>todo</div>

					<SettingDetail size="md">Tools</SettingDetail>
					<div>
						<DropdownMenu
							items={toolsGroupByProvider}
							onSelect={(e, option) => {
								handleToolSelect(e, { value: String(option.value) });
							}}
							trigger={
								<Button variant="solid" leftIcon={<PlusIcon />}>
									Add
								</Button>
							}
							modal={false}
						/>
						{selectedTool && (
							<ToolConfigurationDialog
								tool={selectedTool}
								open={toolDialogOpen}
								onOpenChange={handleToolDialogOpenChange}
								onSubmit={handleToolConfigSubmit}
								trigger={null}
							/>
						)}
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
