"use client";

import {
	FileCategory,
	isImageGenerationLanguageModelData,
	isTextGenerationLanguageModelData,
} from "@giselle-sdk/data-type";
import {
	githubActions,
	githubTriggers,
	manualTriggers,
} from "@giselle-sdk/flow";
import {
	Capability,
	type LanguageModel,
	hasCapability,
	hasTierAccess,
	languageModels,
} from "@giselle-sdk/language-model";
import clsx from "clsx/lite";
import { useFeatureFlag } from "giselle-sdk/react";
import { useUsageLimits, useWorkflowDesigner } from "giselle-sdk/react";
import {
	MousePointerClickIcon,
	SquareFunctionIcon,
	WorkflowIcon,
} from "lucide-react";
import { Dialog, Popover, ToggleGroup } from "radix-ui";
import { type ReactNode, useState } from "react";
import {
	AnthropicIcon,
	AudioIcon,
	DocumentIcon,
	GenNodeIcon,
	GenerateImageIcon,
	GenerateTextIcon,
	GitHubIcon,
	GoogleWhiteIcon,
	OpenaiIcon,
	PdfFileIcon,
	PerplexityIcon,
	PictureIcon,
	PromptIcon,
	SearchIcon,
	SourceLinkIcon,
	TextFileIcon,
	UploadIcon,
	VideoIcon,
	WilliIcon,
} from "../../../icons";
import { ImageGenerationNodeIcon } from "../../../icons/node";
import { Tooltip } from "../../../ui/tooltip";
import { isToolAction } from "../types";
import {
	actionNode,
	addNodeTool,
	fileNode,
	imageGenerationNode,
	selectActionTool,
	selectFileNodeCategoryTool,
	selectLanguageModelTool,
	selectSourceCategoryTool,
	selectTriggerTool,
	textGenerationNode,
	textNode,
	triggerNode,
	useToolbar,
} from "./state";

function TooltipAndHotkey({ text, hotkey }: { text: string; hotkey?: string }) {
	return (
		<div className="flex items-center gap-1">
			<span>{text}</span>
			{hotkey && (
				<span className="text-black-400 uppercase ml-1">{hotkey}</span>
			)}
		</div>
	);
}

function CapabilityIcon({
	children,
	icon,
}: {
	children: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<span className="flex gap-[4px] rounded-[20px] border-[1px] border-white-800 px-[8px] py-[2px] text-[12px]">
			{icon && (
				<span className="flex items-center scale-90 text-white-950">
					{icon}
				</span>
			)}
			{children}
		</span>
	);
}

function ProTag() {
	return (
		<span className="inline-flex justify-center items-center rounded-[4px] border border-primary-400 px-[2px] py-[0px] text-[11px] leading-tight font-accent font-semibold text-primary-400">
			Pro
		</span>
	);
}

function LanguageModelListItem({
	languageModel,
	...props
}: Omit<ToggleGroup.ToggleGroupItemProps, "value"> & {
	languageModel: LanguageModel;
}) {
	return (
		<button
			{...props}
			className={clsx(
				"flex gap-[8px]",
				"hover:bg-white-850/10 focus:bg-white-850/10 p-[4px] rounded-[4px]",
				"data-[state=on]:bg-primary-900 focus:outline-none",
				"**:data-icon:w-[16px] **:data-icon:h-[16px] **:data-icon:text-white-950 ",
			)}
		>
			<div className="flex gap-[12px] items-center">
				{languageModel.provider === "anthropic" && (
					<AnthropicIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "openai" && (
					<OpenaiIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "google" && (
					<GoogleWhiteIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "perplexity" && (
					<PerplexityIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "fal" && (
					<ImageGenerationNodeIcon
						modelId={languageModel.id}
						className="w-[18px] h-[18px]"
						data-icon
					/>
				)}
				<div className="flex items-center gap-[8px]">
					<p className="text-[14px] text-left text-nowrap">
						{languageModel.id}
					</p>
					{languageModel.tier === "pro" && <ProTag />}
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
	const { flowNode } = useFeatureFlag();
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
						"flex items-center px-[8px] z-10 h-full gap-[12px] text-white-950",
						"**:data-tool:hover:bg-white-850/10 **:data-tool:p-[4px] **:data-tool:rounded-[4px]",
						"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
						"**:data-icon:w-[24px] **:data-icon:h-[24px] **:data-icon:text-white-950 ",
					)}
					value={selectedTool?.action}
					onValueChange={(value) => {
						if (isToolAction(value)) {
							switch (value) {
								case "addTextNode":
									setSelectedTool(addNodeTool(textNode()));
									break;
								case "selectLanguageModel":
									setSelectedTool(selectLanguageModelTool());
									break;
								case "selectFileNodeCategory":
									setSelectedTool(selectFileNodeCategoryTool());
									break;
								case "selectSourceCategory":
									setSelectedTool(selectSourceCategoryTool());
									break;
								case "selectTrigger":
									setSelectedTool(selectTriggerTool());
									break;
								case "selectAction":
									setSelectedTool(selectActionTool());
									break;
							}
						}
					}}
				>
					{flowNode && (
						<>
							<ToggleGroup.Item
								value="selectTrigger"
								data-tool
								className="relative"
							>
								<Tooltip text={<TooltipAndHotkey text="Trigger" hotkey="t" />}>
									<MousePointerClickIcon data-icon />
								</Tooltip>
								{selectedTool?.action === "selectTrigger" && (
									<Popover.Root open={true}>
										<Popover.Anchor />
										<Popover.Portal>
											<Popover.Content
												className={clsx(
													"relative rounded-[8px] px-[8px] py-[8px]",
													"bg-[hsla(255,_40%,_98%,_0.04)] text-white-900",
													"backdrop-blur-[4px]",
												)}
												sideOffset={42}
											>
												<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-border border-transparent" />
												<div className="relative flex flex-col gap-[8px]">
													<ToggleGroup.Root
														type="single"
														className={clsx(
															"flex flex-col gap-[8px]",
															"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
															"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-white-900/10",
															"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
														)}
														onValueChange={(value) => {
															setSelectedTool(addNodeTool(triggerNode(value)));
														}}
													>
														{manualTriggers.map((manualTrigger) => (
															<ToggleGroup.Item
																key={manualTrigger.id}
																value={manualTrigger.id}
																data-tool
															>
																<MousePointerClickIcon className="w-[20px] h-[20px] shrink-0" />
																<p className="text-[14px]">
																	{manualTrigger.label}
																</p>
															</ToggleGroup.Item>
														))}
													</ToggleGroup.Root>
													<ToggleGroup.Root
														type="single"
														className={clsx(
															"flex flex-col gap-[8px]",
															"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
															"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-white-900/10",
															"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
														)}
														onValueChange={(value) => {
															setSelectedTool(addNodeTool(triggerNode(value)));
														}}
													>
														{githubTriggers.map((githubTrigger) => (
															<ToggleGroup.Item
																key={githubTrigger.id}
																value={githubTrigger.id}
																data-tool
															>
																<GitHubIcon className="w-[20px] h-[20px] shrink-0" />
																<p className="text-[14px]">
																	{githubTrigger.label}
																</p>
															</ToggleGroup.Item>
														))}
													</ToggleGroup.Root>
												</div>
											</Popover.Content>
										</Popover.Portal>
									</Popover.Root>
								)}
							</ToggleGroup.Item>

							<ToggleGroup.Item
								value="selectAction"
								data-tool
								className="relative"
							>
								<Tooltip text={<TooltipAndHotkey text="Action" hotkey="a" />}>
									<WorkflowIcon data-icon />
								</Tooltip>
								{selectedTool?.action === "selectAction" && (
									<Popover.Root open={true}>
										<Popover.Anchor />
										<Popover.Portal>
											<Popover.Content
												className={clsx(
													"relative rounded-[8px] px-[8px] py-[8px]",
													"bg-[hsla(255,_40%,_98%,_0.04)] text-white-900",
													"backdrop-blur-[4px]",
												)}
												sideOffset={42}
											>
												<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-border border-transparent" />
												<div className="relative flex flex-col gap-[8px]">
													<ToggleGroup.Root
														type="single"
														className={clsx(
															"flex flex-col gap-[8px]",
															"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
															"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-white-900/10",
															"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
														)}
														onValueChange={(value) => {
															setSelectedTool(addNodeTool(actionNode(value)));
														}}
													>
														{githubActions.map((githubAction) => (
															<ToggleGroup.Item
																key={githubAction.id}
																value={githubAction.id}
																data-tool
															>
																<GitHubIcon className="w-[20px] h-[20px] shrink-0" />
																<p className="text-[14px]">
																	{githubAction.label}
																</p>
															</ToggleGroup.Item>
														))}
													</ToggleGroup.Root>
												</div>
											</Popover.Content>
										</Popover.Portal>
									</Popover.Root>
								)}
							</ToggleGroup.Item>
						</>
					)}

					<ToggleGroup.Item value="selectLanguageModel" data-tool>
						<Tooltip text={<TooltipAndHotkey text="Generation" hotkey="G" />}>
							<GenNodeIcon data-icon />
						</Tooltip>
						{selectedTool?.action === "selectLanguageModel" && (
							<Dialog.Root>
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
															isTextGenerationLanguageModelData(
																languageModelData,
															)
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
													{languageModels
														.filter((languageModel) =>
															llmProviders.includes(languageModel.provider),
														)
														.map((languageModel) =>
															languageModelAvailable(languageModel) ? (
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
																	asChild
																>
																	<LanguageModelListItem
																		languageModel={languageModel}
																	/>
																</ToggleGroup.Item>
															) : (
																<Dialog.Trigger
																	asChild
																	key={languageModel.id}
																	onMouseEnter={() =>
																		setLanguageModelMouseHovered(languageModel)
																	}
																	onFocus={() =>
																		setLanguageModelMouseHovered(languageModel)
																	}
																	data-tool
																>
																	<LanguageModelListItem
																		languageModel={languageModel}
																	/>
																</Dialog.Trigger>
															),
														)}
												</ToggleGroup.Root>
											</div>
										</Popover.Content>
									</Popover.Portal>
								</Popover.Root>
								<Dialog.Portal>
									<Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50" />
									<Dialog.Content
										className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[500px] bg-black-900 rounded-[12px] p-[32px] shadow-xl z-50 overflow-hidden border border-black-400 flex flex-col items-start gap-[20px]"
										onCloseAutoFocus={(e) => {
											e.preventDefault();
										}}
									>
										<Dialog.Title
											className="text-[20px] font-hubot font-semibold leading-[140%] text-[#B8E8F4] w-full text-center"
											style={{ textShadow: "0px 0px 10px #0087F6" }}
										>
											Upgrade to Pro
										</Dialog.Title>
										<Dialog.Description className="text-[#B5C0CA] text-[14px] font-[Geist] font-medium leading-[170%]">
											Unlock the full power of AI for your projects! With Pro,
											you'll get:
										</Dialog.Description>
										<ul className="text-[#B5C0CA] text-[14px] font-[Geist] font-medium leading-[170%] list-disc pl-[20px] space-y-[12px]">
											<li>
												Access to all premium AI models for smarter, faster
												results
											</li>
											<li>
												$20 of AI usage included (unlimited during our special
												promotion!)
											</li>
											<li>
												Seamless team collaboration with easy member invites
											</li>
											<li>Priority email support when you need it</li>
										</ul>
										<p className="text-[#B5C0CA] text-[14px] font-[Geist] font-medium leading-[170%]">
											Take your development to the next level with advanced AI
											capabilities that save time and enhance your workflow.
											Your ideas deserve the best tools!
										</p>
										<div className="w-full flex justify-center mt-[8px]">
											<a
												className="bg-primary-100 text-black-900 font-hubot border-none rounded-[8px] px-8 py-3 font-semibold text-[16px] hover:opacity-90 transition-opacity"
												href="/settings/team"
												target="_blank"
												rel="noopener noreferrer"
											>
												Upgrade
											</a>
										</div>
										<Dialog.Close className="absolute top-[12px] right-[12px] text-white-400 hover:text-white-100">
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												role="img"
												aria-label="Close dialog"
											>
												<title>Close dialog</title>
												<path
													d="M18 6L6 18M6 6L18 18"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</Dialog.Close>
									</Dialog.Content>
								</Dialog.Portal>
							</Dialog.Root>
						)}
						<div className="absolute left-[calc(var(--language-model-detail-panel-width)_+_56px)]">
							<div className="relative">
								{selectedTool?.action === "selectLanguageModel" && (
									<Popover.Root open={true}>
										<Popover.Anchor />
										<Popover.Portal>
											<Popover.Content
												className="bg-black-900/10 w-[var(--language-model-detail-panel-width)] backdrop-blur-[4px] rounded-[8px] px-[8px] py-[8px] "
												sideOffset={42}
												align="end"
												onOpenAutoFocus={(e) => {
													e.preventDefault();
												}}
											>
												<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-boarder border-transparent" />
												<div className="relative text-white-800 h-[200px]">
													{languageModelMouseHovered && (
														<div className="px-[16px] py-[16px] flex flex-col gap-[24px]">
															<div className="flex items-start gap-[16px]">
																<div className="flex items-center shrink-0">
																	{languageModelMouseHovered.provider ===
																		"anthropic" && (
																		<AnthropicIcon
																			className="size-[24px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"openai" && (
																		<OpenaiIcon
																			className="size-[24px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"google" && (
																		<GoogleWhiteIcon
																			className="size-[24px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"perplexity" && (
																		<PerplexityIcon
																			className="size-[24px]"
																			data-icon
																		/>
																	)}
																	{languageModelMouseHovered.provider ===
																		"fal" && (
																		<ImageGenerationNodeIcon
																			modelId={languageModelMouseHovered.id}
																			className="size-[24px]"
																			data-icon
																		/>
																	)}
																</div>
																<p className="text-[22px] font-accent leading-none">
																	{languageModelMouseHovered.id}
																</p>
															</div>
															<div className="flex flex-wrap gap-x-[8px] gap-y-[8px]">
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.TextGeneration,
																) && (
																	<CapabilityIcon
																		icon={
																			<GenerateTextIcon
																				data-icon
																				className="w-[16px] h-[16px]"
																			/>
																		}
																	>
																		Generate Text
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.ImageGeneration,
																) && (
																	<CapabilityIcon
																		icon={
																			<GenerateImageIcon
																				data-icon
																				className="w-[16px] h-[16px]"
																			/>
																		}
																	>
																		Generate Image
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.PdfFileInput,
																) && (
																	<CapabilityIcon
																		icon={
																			<DocumentIcon className="w-[16px] h-[16px]" />
																		}
																	>
																		Input PDF
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.ImageFileInput,
																) && (
																	<CapabilityIcon
																		icon={
																			<PictureIcon className="w-[16px] h-[16px]" />
																		}
																	>
																		Input Image
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.SearchGrounding,
																) && (
																	<CapabilityIcon
																		icon={
																			<SearchIcon className="w-[16px] h-[16px]" />
																		}
																	>
																		Web Search
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.OptionalSearchGrounding,
																) && (
																	<CapabilityIcon
																		icon={
																			<SearchIcon className="w-[16px] h-[16px]" />
																		}
																	>
																		Web Search
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.Reasoning,
																) && (
																	<CapabilityIcon
																		icon={
																			<svg
																				width="16"
																				height="16"
																				viewBox="0 0 16 16"
																				fill="none"
																				xmlns="http://www.w3.org/2000/svg"
																				role="img"
																				aria-label="Reasoning icon"
																			>
																				<title>Reasoning icon</title>
																				<path
																					d="M7.6655 3.54182C5.2655 3.54182 3.31641 5.68727 3.31641 8.32C3.31641 10.0436 4.47277 11.3018 5.3455 12.1745V13.1418C5.3455 14.5018 6.45095 15.6 7.80368 15.6C9.00368 15.6 9.97822 14.6255 9.97822 13.4255V12.32C9.97822 12.32 10.0146 12.2982 10.0219 12.2764C10.08 12.2036 10.1528 12.1091 10.2473 12C10.8655 11.2509 12.0073 9.86182 12.0073 8.31273C12.0073 5.68 10.0582 3.53455 7.65822 3.53455L7.6655 3.54182ZM7.80368 14.1527C7.25095 14.1527 6.80004 13.7018 6.80004 13.1491V12.5236C6.85095 12.4582 6.90186 12.4 6.93095 12.3273H8.53095V13.44C8.53095 13.84 8.20368 14.16 7.81095 14.16L7.80368 14.1527ZM9.30186 10.8727C9.30186 10.8727 9.27277 10.8655 9.25822 10.8655H6.10186C5.44004 10.1745 4.77095 9.32364 4.77095 8.32C4.77095 6.48727 6.07277 4.99636 7.6655 4.99636C9.25822 4.99636 10.56 6.48727 10.56 8.32C10.56 9.23636 9.81822 10.24 9.30186 10.8727Z"
																					fill="currentColor"
																				/>
																				<path
																					d="M1.72383 6.07996H0.727465C0.538374 6.07996 0.342011 6.15996 0.211102 6.29087C0.138374 6.35632 0.0874654 6.43632 0.0583745 6.52359C0.0147381 6.61087 -0.00708008 6.70541 -0.00708008 6.80723C0.000192649 6.99632 0.0656472 7.19268 0.203829 7.32359C0.349284 7.4545 0.523829 7.5345 0.720193 7.5345H1.71656C1.90565 7.5345 2.10201 7.4545 2.23292 7.32359C2.30565 7.25814 2.35656 7.17814 2.38565 7.09087C2.42928 7.00359 2.4511 6.90905 2.4511 6.80723C2.44383 6.61814 2.37837 6.42177 2.24019 6.29087C2.09474 6.15996 1.92019 6.07996 1.72383 6.07996Z"
																					fill="currentColor"
																				/>
																				<path
																					d="M3.86182 3.59999C3.94909 3.5709 4.02909 3.51999 4.09455 3.44726C4.13091 3.39635 4.16727 3.35271 4.21091 3.30181C4.27637 3.18544 4.31273 3.06908 4.31273 2.93817L4.28364 2.74181C4.24727 2.61817 4.18909 2.50908 4.09455 2.42181L3.38909 1.71635C3.32364 1.64362 3.24364 1.59271 3.15637 1.56362C3.06909 1.51999 2.97455 1.49817 2.87273 1.49817C2.77091 1.49817 2.67637 1.51271 2.58909 1.56362C2.50182 1.59271 2.42182 1.64362 2.35637 1.71635C2.32 1.76726 2.28364 1.8109 2.24 1.86181C2.17455 1.97817 2.13818 2.09453 2.13818 2.22544L2.16727 2.42181C2.20364 2.54544 2.26182 2.65453 2.35637 2.74181C2.58909 2.97453 2.82909 3.21453 3.06182 3.44726C3.12727 3.51999 3.20727 3.5709 3.29455 3.59999C3.38182 3.64362 3.47637 3.66544 3.57818 3.66544C3.68 3.66544 3.77455 3.6509 3.86182 3.59999Z"
																					fill="currentColor"
																				/>
																				<path
																					d="M15.3165 6.29819C15.1711 6.16728 14.9965 6.08728 14.8002 6.08728H13.8038C13.6147 6.08728 13.4184 6.16728 13.2875 6.29819C13.2147 6.36364 13.1638 6.44364 13.1347 6.53092C13.0911 6.61819 13.0693 6.71273 13.0693 6.81455C13.0765 7.00364 13.142 7.20001 13.2802 7.33092C13.4256 7.46183 13.6002 7.54183 13.7965 7.54183H14.7929C14.982 7.54183 15.1784 7.46183 15.3093 7.33092C15.382 7.26546 15.4329 7.18546 15.462 7.09819C15.5056 7.01092 15.5275 6.91637 15.5275 6.81455C15.5202 6.62546 15.4547 6.4291 15.3165 6.29819Z"
																					fill="currentColor"
																				/>
																				<path
																					d="M13.3164 2.50903C13.36 2.42175 13.3818 2.32721 13.3818 2.22539C13.3818 2.12357 13.3673 2.02903 13.3164 1.94175C13.2873 1.85448 13.2364 1.77448 13.1636 1.70903C13.1127 1.67266 13.0691 1.6363 13.0182 1.59266C12.9018 1.52721 12.7854 1.49084 12.6545 1.49084L12.4582 1.51994C12.3345 1.5563 12.2254 1.61448 12.1382 1.70903C11.9054 1.94175 11.6654 2.18175 11.4327 2.41448C11.36 2.47994 11.3091 2.55994 11.28 2.64721C11.2364 2.73448 11.2145 2.82903 11.2145 2.93084C11.2145 3.03266 11.2291 3.12721 11.28 3.21448C11.3091 3.30175 11.36 3.38175 11.4327 3.44721C11.4836 3.48357 11.5273 3.51994 11.5782 3.56357C11.6945 3.62903 11.8109 3.66539 11.9418 3.66539L12.1382 3.6363C12.2618 3.59994 12.3709 3.54175 12.4582 3.44721C12.6909 3.21448 12.9309 2.97448 13.1636 2.74175C13.2364 2.6763 13.2873 2.5963 13.3164 2.50903Z"
																					fill="currentColor"
																				/>
																				<path
																					d="M7.38187 2.3854C7.46914 2.42904 7.56369 2.45086 7.66551 2.45086C7.8546 2.44358 8.05096 2.37813 8.18187 2.23995C8.31278 2.09449 8.39278 1.91995 8.39278 1.72358V0.727221C8.39278 0.53813 8.31278 0.341767 8.18187 0.210858C8.11641 0.13813 8.03641 0.0872212 7.94914 0.0581303C7.86187 0.014494 7.76732 -0.00732422 7.66551 -0.00732422C7.47641 -5.14914e-05 7.28005 0.0654031 7.14914 0.203585C7.01823 0.349039 6.93823 0.523585 6.93823 0.719949V1.71631C6.93823 1.9054 7.01823 2.10177 7.14914 2.23268C7.2146 2.3054 7.2946 2.35631 7.38187 2.3854Z"
																					fill="currentColor"
																				/>
																			</svg>
																		}
																	>
																		Reasoning
																	</CapabilityIcon>
																)}
																{hasCapability(
																	languageModelMouseHovered,
																	Capability.GenericFileInput,
																) && (
																	<>
																		<CapabilityIcon
																			icon={
																				<DocumentIcon className="w-[16px] h-[16px]" />
																			}
																		>
																			Input PDF
																		</CapabilityIcon>
																		<CapabilityIcon
																			icon={
																				<PictureIcon className="w-[16px] h-[16px]" />
																			}
																		>
																			Input Image
																		</CapabilityIcon>
																		<CapabilityIcon
																			icon={
																				<AudioIcon className="w-[16px] h-[16px]" />
																			}
																		>
																			Input Audio
																		</CapabilityIcon>
																		<CapabilityIcon
																			icon={
																				<VideoIcon className="w-[16px] h-[16px]" />
																			}
																		>
																			Input Video
																		</CapabilityIcon>
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
					<ToggleGroup.Item
						value="selectSourceCategory"
						data-tool
						className="relative"
					>
						<Tooltip text={<TooltipAndHotkey text="Source" hotkey="s" />}>
							<SourceLinkIcon data-icon />
						</Tooltip>
						{selectedTool?.action === "selectSourceCategory" && (
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
										<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-border border-transparent" />
										<div className="relative flex flex-col gap-[8px]">
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-white-900/10",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={(sourceType) => {
													if (sourceType === "text") {
														setSelectedTool(addNodeTool(textNode()));
													}
													// Add more source types here in the future if needed
												}}
											>
												<ToggleGroup.Item value="text" data-tool>
													<PromptIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Plain Text</p>
												</ToggleGroup.Item>
											</ToggleGroup.Root>
										</div>
									</Popover.Content>
								</Popover.Portal>
							</Popover.Root>
						)}
					</ToggleGroup.Item>
					<ToggleGroup.Item
						value="selectFileNodeCategory"
						data-tool
						className="relative"
					>
						<Tooltip text={<TooltipAndHotkey text="Upload" hotkey="u" />}>
							<UploadIcon data-icon />
						</Tooltip>
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
					<ToggleGroup.Item
						value="agent"
						data-tool
						className="relative opacity-50 cursor-not-allowed"
					>
						<Tooltip text={<TooltipAndHotkey text="Agent (Coming Soon)" />}>
							<WilliIcon data-icon />
						</Tooltip>
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
		</div>
	);
}
