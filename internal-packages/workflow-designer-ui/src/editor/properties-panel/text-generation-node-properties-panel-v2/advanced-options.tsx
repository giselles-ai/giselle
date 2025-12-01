import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import {
	getEntry,
	type LanguageModelTool,
	languageModelTools,
} from "@giselles-ai/language-model-registry";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { titleCase } from "@giselles-ai/utils";
import { ChevronRightIcon, PlusIcon, XIcon } from "lucide-react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { ToolConfigurationDialog } from "./tool";

export function AdvancedOptions({
	node,
	onToolChanges,
}: {
	node: ContentGenerationNode;
	onToolChanges?: (value: ContentGenerationNode["content"]["tools"]) => void;
}) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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

	const languageModel = useMemo(
		() => getEntry(node.content.languageModel.id),
		[node.content.languageModel.id],
	);
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

	const configuredToolNames = useMemo(
		() => new Set(configuredTools.map((tool) => tool.name)),
		[configuredTools],
	);
	const toolsGroupByProvider = useMemo(() => {
		const makeItems = (provider: string) =>
			languageModelTools
				.filter(
					(tool: LanguageModelTool) =>
						tool.provider === provider && !configuredToolNames.has(tool.name),
				)
				.map((tool: LanguageModelTool) => ({
					value: tool.name,
					label: tool?.title ?? tool.name,
				}));

		return [
			{
				groupId: "giselle",
				groupLabel: "Hosted",
				items: makeItems("giselle"),
			},
			{
				groupId: languageModel.provider,
				groupLabel: `${titleCase(languageModel.provider)} Provides`,
				items: makeItems(languageModel.provider),
			},
		].filter((group) => group.items.length > 0);
	}, [configuredToolNames, languageModel.provider]);

	const handleToolSelect = (_e: unknown, item: { value: string }) => {
		const toolName = item.value;

		const tool = languageModelTools.find(
			(t: LanguageModelTool) => t.name === toolName,
		);
		// If tool has no configuration options, add it immediately without dialog
		if (tool && Object.keys(tool.configurationOptions).length === 0) {
			onToolChanges?.([
				...node.content.tools,
				{ name: tool.name, configuration: {} },
			]);
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
		const existingTools = node.content.tools ?? [];
		const updatedTools = existingTools.filter((tool) => tool.name !== toolName);
		onToolChanges?.(updatedTools);
	};

	const handleToolConfigSubmit = (config: Record<string, unknown> = {}) => {
		if (selectedTool === null) {
			return;
		}
		// Transform to content-generation.ts tools format
		const toolEntry = {
			name: selectedTool.name,
			configuration: config,
		};

		// Get existing tools array or create new one
		const existingTools = node.content.tools;

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

		onToolChanges?.(updatedTools);

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
	return (
		<div className="col-span-2 rounded-[8px] bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)] px-[8px] py-[8px] mt-[8px]">
			<button
				type="button"
				onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
				className="flex items-center gap-[8px] w-full text-left text-inverse hover:text-primary-900 transition-colors"
			>
				<ChevronRightIcon
					className={`size-[14px] text-link-muted transition-transform ${isAdvancedOpen ? "rotate-90" : ""}`}
				/>
				<SettingLabel inline className="mb-0">
					Advanced options
				</SettingLabel>
			</button>
			{isAdvancedOpen && (
				<div className="mt-[12px]">
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
														className="group z-50 overflow-hidden rounded-md px-4 py-4 text-[12px] shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[300px] bg-surface text-inverse"
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
			)}
		</div>
	);
}
