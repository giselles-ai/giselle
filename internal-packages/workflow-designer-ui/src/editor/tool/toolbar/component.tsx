"use client";

import {
	FileCategory,
	isImageGenerationLanguageModelData,
	isTextGenerationLanguageModelData,
} from "@giselle-sdk/data-type";
import {
	Capability,
	type LanguageModel,
	hasCapability,
	hasTierAccess,
	languageModels,
} from "@giselle-sdk/language-model";
import clsx from "clsx/lite";
import { useUsageLimits, useWorkflowDesigner } from "giselle-sdk/react";
import { MousePointer2Icon } from "lucide-react";
import { Popover, ToggleGroup } from "radix-ui";
import { type ReactNode, useState } from "react";
import {
	AnthropicIcon,
	DocumentIcon,
	GoogleWhiteIcon,
	OpenaiIcon,
	PdfFileIcon,
	PerplexityIcon,
	PictureIcon,
	PromptIcon,
	StackBlicksIcon,
	TextFileIcon,
} from "../../../icons";
import { ImageGenerationNodeIcon } from "../../../icons/node";
import { Tooltip } from "../../../ui/tooltip";
import { isToolAction } from "../types";
import {
	addNodeTool,
	addTextGenerationNodeTool,
	fileNode,
	imageGenerationNode,
	moveTool,
	selectFileNodeCategoryTool,
	selectLanguageModelTool,
	textGenerationNode,
	textNode,
	useToolbar,
} from "./state";

function TooltipAndHotkey({ text, hotkey }: { text: string; hotkey?: string }) {
	return (
		<div className="flex justify-between items-center gap-[8px]">
			<p>{text}</p>
			{hotkey && <p className="uppercase text-black-70">{hotkey}</p>}
		</div>
	);
}

function CapabilityIcon({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<span className="flex gap-[4px] rounded-[20px] border-[1px] border-white-800 px-[8px] py-[2px] text-[10px]">
			{children}
		</span>
	);
}
function LanguageModelListItem({
	languageModel,
	disabled,
	...props
}: Omit<ToggleGroup.ToggleGroupItemProps, "value"> & {
	languageModel: LanguageModel;
	disabled?: boolean;
}) {
	return (
		<button
			{...props}
			className={clsx(
				"flex gap-[8px]",
				"hover:bg-white-850/10 focus:bg-white-850/10 p-[4px] rounded-[4px]",
				"data-[state=on]:bg-primary-900 focus:outline-none",
				"**:data-icon:w-[24px] **:data-icon:h-[24px] **:data-icon:text-white-950 ",
				disabled && "opacity-50 cursor-not-allowed",
			)}
			disabled={disabled}
		>
			{languageModel.provider === "anthropic" && (
				<AnthropicIcon className="w-[20px] h-[20px]" data-icon />
			)}
			{languageModel.provider === "openai" && (
				<OpenaiIcon className="w-[20px] h-[20px]" data-icon />
			)}
			{languageModel.provider === "google" && (
				<GoogleWhiteIcon className="w-[20px] h-[20px]" data-icon />
			)}
			{languageModel.provider === "perplexity" && (
				<PerplexityIcon className="w-[20px] h-[20px]" data-icon />
			)}
			{languageModel.provider === "fal" && (
				<ImageGenerationNodeIcon
					modelId={languageModel.id}
					className="w-[20px] h-[20px]"
					data-icon
				/>
			)}
			<div className="flex flex-start gap-[8px]">
				<p className="text-[14px] text-left text-nowrap">{languageModel.id}</p>
				<div>
					{languageModel.tier === "pro" && <CapabilityIcon>Pro</CapabilityIcon>}
				</div>
			</div>
		</button>
	);
}

export function Toolbar() {
	const { setSelectedTool, selectedTool } = useToolbar();
	const [languageModelMouseHovered, setLanguageModelMouseHovered] =
		useState<LanguageModel | null>(null);
	const { llmProviders } = useWorkflowDesigner();
	const limits = useUsageLimits();
	const languageModelAvailable = (languageModel: LanguageModel) => {
		if (limits === undefined) {
			return true;
		}
		return hasTierAccess(languageModel, limits.featureTier);
	};

	return (
		<div className="relative rounded-[8px] overflow-hidden bg-white-900/10">
			<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-boarder border-transparent" />
			<div className="flex divide-x divide-[hsla(232,36%,72%,0.2)] items-center px-[8px] py-[8px]">
				<ToggleGroup.Root
					type="single"
					className={clsx(
						"flex items-center px-[16px] z-10 h-full gap-[12px] text-white-950",
						"**:data-tool:hover:bg-white-850/10 **:data-tool:p-[4px] **:data-tool:rounded-[4px]",
						"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
						"**:data-icon:w-[24px] **:data-icon:h-[24px] **:data-icon:text-white-950 ",
					)}
					value={selectedTool?.action}
					onValueChange={(value) => {
						if (isToolAction(value)) {
							switch (value) {
								case "move":
									setSelectedTool(moveTool());
									break;
								case "addTextNode":
									setSelectedTool(addNodeTool(textNode()));
									break;
								case "selectLanguageModel":
									setSelectedTool(selectLanguageModelTool());
									break;
								case "selectFileNodeCategory":
									setSelectedTool(selectFileNodeCategoryTool());
									break;
							}
						}
					}}
				>
					<ToggleGroup.Item value="move" data-tool>
						<Tooltip text={<TooltipAndHotkey text="Move" hotkey="v" />}>
							<MousePointer2Icon data-icon />
						</Tooltip>
					</ToggleGroup.Item>
					<ToggleGroup.Item value="addTextNode" data-tool>
						<Tooltip text={<TooltipAndHotkey text="Text" hotkey="t" />}>
							<PromptIcon data-icon />
						</Tooltip>
					</ToggleGroup.Item>
					<ToggleGroup.Item
						value="selectFileNodeCategory"
						data-tool
						className="relative"
					>
						<DocumentIcon data-icon />
						{selectedTool?.action === "selectFileNodeCategory" && (
							<Popover.Root open={true}>
								<Popover.Anchor />
								<Popover.Portal>
									<Popover.Content
										className={clsx(
											"relative w-[160px] rounded-[8px] px-[8px] py-[8px]",
											"bg-[hsla(255,_40%,_98%,_0.04)] text-white-900",
											"backdrop-blur-[4px]",
										)}
										sideOffset={42}
									>
										<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-boarder border-transparent" />
										<div className="relative flex flex-col gap-[8px]">
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-white-900/10",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={(fileCategory) => {
													setSelectedTool(
														addNodeTool(
															fileNode(FileCategory.parse(fileCategory)),
														),
													);
												}}
											>
												<ToggleGroup.Item value="pdf" data-tool>
													<PdfFileIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">PDF</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item value="image" data-tool>
													<PictureIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Image</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item value="text" data-tool>
													<TextFileIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Text</p>
												</ToggleGroup.Item>
												{/* <ToggleGroup.Item value="addGitHubNode" data-tool>
													<GitHubIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">GitHub</p>
												</ToggleGroup.Item> */}
											</ToggleGroup.Root>
										</div>
									</Popover.Content>
								</Popover.Portal>
							</Popover.Root>
						)}
					</ToggleGroup.Item>
					<ToggleGroup.Item value="selectLanguageModel" data-tool>
						<StackBlicksIcon data-icon />
						{selectedTool?.action === "selectLanguageModel" && (
							<Popover.Root open={true}>
								<Popover.Anchor />
								<Popover.Portal>
									<Popover.Content
										className={clsx(
											"relative rounded-[8px] px-[8px] py-[8px] w-[var(--language-model-toggle-group-popover-width)]",
											"bg-black-900/10 text-white-900",
											"backdrop-blur-[4px]",
										)}
										align="end"
										sideOffset={42}
									>
										<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-boarder border-transparent" />
										<div className="relative flex flex-col gap-[8px] max-h-[200px] overflow-y-auto">
											<ToggleGroup.Root
												type="single"
												className={clsx("flex flex-col gap-[8px]")}
												onValueChange={(modelId) => {
													const languageModel = languageModels.find(
														(model) => model.id === modelId,
													);
													const languageModelData = {
														id: languageModel?.id,
														provider: languageModel?.provider,
														configurations: languageModel?.configurations,
													};
													if (
														isTextGenerationLanguageModelData(languageModelData)
													) {
														setSelectedTool(
															addNodeTool(
																textGenerationNode(languageModelData),
															),
														);
													}
													if (
														isImageGenerationLanguageModelData(
															languageModelData,
														)
													) {
														setSelectedTool(
															addNodeTool(
																imageGenerationNode(languageModelData),
															),
														);
													}
												}}
											>
												{languageModels.map(
													(languageModel) =>
														llmProviders.includes(languageModel.provider) && (
															<ToggleGroup.Item
																data-tool
																value={languageModel.id}
																key={languageModel.id}
																onMouseEnter={() =>
																	setLanguageModelMouseHovered(languageModel)
																}
																onFocus={() =>
																	setLanguageModelMouseHovered(languageModel)
																}
																disabled={
																	!languageModelAvailable(languageModel)
																}
																asChild
															>
																<LanguageModelListItem
																	languageModel={languageModel}
																	disabled={
																		!languageModelAvailable(languageModel)
																	}
																/>
															</ToggleGroup.Item>
														),
												)}
											</ToggleGroup.Root>
										</div>
									</Popover.Content>
								</Popover.Portal>
							</Popover.Root>
						)}
						<div className="absolute left-[calc(var(--language-model-detail-panel-width)_+_16px)]">
							<div className="relative">
								{selectedTool?.action === "selectLanguageModel" && (
									<Popover.Root open={true}>
										<Popover.Anchor />
										<Popover.Portal>
											<Popover.Content
												className="bg-black-900/10 w-[var(--language-model-detail-panel-width)] backdrop-blur-[4px] rounded-[8px] px-[8px] py-[8px] "
												sideOffset={42}
												align="center"
												onOpenAutoFocus={(e) => {
													e.preventDefault();
												}}
											>
												<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-boarder border-transparent" />
												<div className="relative text-white-800 h-[200px] ">
													{languageModelMouseHovered && (
														<div className="px-[16px] py-[24px] flex flex-col gap-[16px]">
															<div className="flex gap-[8px] items-center">
																<div className="shrink-0">
																	{languageModelMouseHovered.provider ===
																		"anthropic" && (
																		<AnthropicIcon
																			className="size-[20px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"openai" && (
																		<OpenaiIcon
																			className="size-[20px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"google" && (
																		<GoogleWhiteIcon
																			className="size-[20px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"perplexity" && (
																		<PerplexityIcon
																			className="size-[20px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"fal" && (
																		<ImageGenerationNodeIcon
																			modelId={languageModelMouseHovered.id}
																			className="size-[20px]"
																			data-icon
																		/>
																	)}
																</div>
																<p className="text-[22px] font-accent">
																	{languageModelMouseHovered.id}
																</p>
															</div>
															<div className="flex gap-[8px] flex-wrap">
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.TextGeneration,
																) && (
																	<CapabilityIcon>Generate Text</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.ImageGeneration,
																) && (
																	<CapabilityIcon>
																		Generate Image
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.PdfFileInput,
																) && <CapabilityIcon>Input PDF</CapabilityIcon>}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.ImageFileInput,
																) && (
																	<CapabilityIcon>Input Image</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.SearchGrounding,
																) && (
																	<CapabilityIcon>Web Search</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.Reasoning,
																) && <CapabilityIcon>Reasoning</CapabilityIcon>}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.GenericFileInput,
																) && (
																	<>
																		<CapabilityIcon>Input PDF</CapabilityIcon>
																		<CapabilityIcon>Input Image</CapabilityIcon>
																		<CapabilityIcon>Input Audio</CapabilityIcon>
																		<CapabilityIcon>Input Video</CapabilityIcon>
																	</>
																)}
															</div>
														</div>
													)}
												</div>
											</Popover.Content>
										</Popover.Portal>
									</Popover.Root>
								)}
							</div>
						</div>
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
		</div>
	);
}
