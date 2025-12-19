"use client";

import { GlassSurfaceLayers } from "@giselle-internal/ui/glass-surface";
import {
	Capability,
	hasCapability,
	type LanguageModel,
	languageModels,
	Tier,
} from "@giselles-ai/language-model";
import {
	createActionNode,
	createAppEntryNode,
	createContentGenerationNode,
	createDocumentVectorStoreNode,
	createFileNode,
	createGitHubVectorStoreNode,
	createQueryNode,
	createTextNode,
	createTriggerNode,
	createWebPageNode,
} from "@giselles-ai/node-registry";
import { FileCategory } from "@giselles-ai/protocol";
import { useFeatureFlag, useUsageLimits } from "@giselles-ai/react";
import clsx from "clsx/lite";
import {
	CableIcon,
	DatabaseZapIcon,
	HammerIcon,
	Layers2Icon,
	SparklesIcon,
} from "lucide-react";
import { Popover, ToggleGroup } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { useAppDesignerStore } from "../../../app-designer";
import { DocumentVectorStoreIcon } from "../../../icons/node/document-vector-store-icon";
import { Tooltip } from "../../../ui/tooltip";
import { isToolAction } from "../types";
import {
	AudioIcon,
	CapabilityIcon,
	DocumentIcon,
	GenerateImageIcon,
	GenerateTextIcon,
	GitHubIcon,
	PdfFileIcon,
	PictureIcon,
	PromptIcon,
	SearchIcon,
	TextFileIcon,
	TooltipAndHotkey,
	VideoIcon,
	WebPageFileIcon,
} from "./components";
import { LanguageModelV2ToggleGroup } from "./language-model-v2";
import { LanguageModelMegaTooltip } from "./language-model-v2/language-model-mega-tooltip";
import {
	filterModelsByCategory,
	filterModelsBySearch,
	getAvailableModels,
	isProModelForFreeUser,
	ModelButton,
	ProviderIcon,
	useHoverState,
} from "./model-components";
import {
	addNodeTool,
	selectContextTool,
	selectFileNodeCategoryTool,
	selectGithubTriggerTool,
	selectIntegrationTool,
	selectLanguageModelTool,
	selectLanguageModelV2Tool,
	useToolbar,
} from "./state";

export function Toolbar() {
	const { setSelectedTool, selectedTool } = useToolbar();
	const {
		hoveredModel: languageModelMouseHovered,
		handleModelHover,
		handleModelLeave,
		handleCapabilityPanelEnter,
		handleCapabilityPanelLeave,
	} = useHoverState();
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string>("All");
	const { llmProviders, nodes } = useAppDesignerStore((s) => ({
		llmProviders: s.llmProviders,
		nodes: s.nodes,
	}));
	const { aiGatewayUnsupportedModels, generateContentNode } = useFeatureFlag();
	const hasAppRequestNode = useMemo(
		() => nodes.some((node) => node.content.type === "appEntry"),
		[nodes],
	);
	const hasEndNode = useMemo(
		() => nodes.some((node) => node.content.type === "end"),
		[nodes],
	);
	const isStageFlowAlreadyPlaced = hasAppRequestNode || hasEndNode;

	const availableLanguageModels = useMemo(
		() =>
			languageModels.filter((model) => {
				if (!llmProviders.includes(model.provider)) {
					return false;
				}
				if (!aiGatewayUnsupportedModels && model.id === "gpt-image-1") {
					return false;
				}
				return true;
			}),
		[llmProviders, aiGatewayUnsupportedModels],
	);

	const modelsFilteredBySearchOnly = availableLanguageModels.filter((model) =>
		filterModelsBySearch(model, searchQuery),
	);

	// Automatically update the category based on search results
	useEffect(() => {
		if (searchQuery.trim() === "") return; // Do nothing for empty search queries

		// Aggregate model capabilities from search results
		const hasTextModels = modelsFilteredBySearchOnly.some((model) =>
			hasCapability(model, Capability.TextGeneration),
		);
		const hasImageModels = modelsFilteredBySearchOnly.some((model) =>
			hasCapability(model, Capability.ImageGeneration),
		);

		// Auto-select the category when only one is present
		if (hasTextModels && !hasImageModels) {
			setSelectedCategory("Text");
		} else if (!hasTextModels && hasImageModels) {
			setSelectedCategory("Image");
		} else {
			// Select All when multiple categories are present
			setSelectedCategory("All");
		}
	}, [searchQuery, modelsFilteredBySearchOnly]);

	// Cleanup is handled by useHoverState hook

	// Models filtered by both search and category
	const filteredModels = modelsFilteredBySearchOnly.filter((model) =>
		filterModelsByCategory(model, selectedCategory),
	);

	// Get user's tier for recommended models
	const usageLimits = useUsageLimits();
	const userTier = usageLimits?.featureTier ?? Tier.enum.free;

	// Recommended models for each provider - adjust based on user tier
	const isFreeUser = userTier === Tier.enum.free;
	const openaiModels = getAvailableModels(
		isFreeUser ? ["gpt-5-nano"] : ["gpt-5"],
		"openai",
		llmProviders,
		availableLanguageModels,
	);
	const anthropicModels = getAvailableModels(
		isFreeUser
			? ["claude-haiku-4.5"]
			: ["claude-sonnet-4.5", "claude-opus-4.5"],
		"anthropic",
		llmProviders,
		availableLanguageModels,
	);
	const googleModels = getAvailableModels(
		isFreeUser
			? ["gemini-2.5-flash-lite"]
			: ["gemini-2.5-pro-exp-03-25", "gemini-1.5-pro-latest", "gemini-1.0-pro"],
		"google",
		llmProviders,
		availableLanguageModels,
	);

	// Combine all recommended models
	const recommendedModels = [
		...openaiModels.slice(0, 1),
		...anthropicModels.slice(0, 1),
		...googleModels.slice(0, 1),
	];

	// Hover management is handled by useHoverState hook

	// Rendering function for each model button
	const renderModelButton = (model: LanguageModel) => (
		<ModelButton
			key={model.id}
			model={model}
			userTier={userTier}
			setSelectedTool={setSelectedTool}
			addNodeTool={addNodeTool}
			onMouseEnter={handleModelHover}
			onMouseLeave={handleModelLeave}
		/>
	);

	const { stage } = useFeatureFlag();

	return (
		<div
			className="relative rounded-[12px] overflow-hidden"
			style={{
				boxShadow:
					"0 0 8px rgba(255, 255, 255, 0.05), 0 0 16px rgba(255, 255, 255, 0.02)",
			}}
		>
			{/* blur+border only; popovers manage their own base fill */}
			<GlassSurfaceLayers
				tone="default"
				borderStyle="solid"
				withBaseFill={true}
				baseFillMixPercent={80}
				zIndexClass="z-0"
			/>
			<div className="flex divide-x divide-[hsla(232,36%,72%,0.2)] items-center px-[4px] py-[8px]">
				<ToggleGroup.Root
					type="single"
					className={clsx(
						"flex items-center px-[4px] z-10 h-full gap-[12px] text-inverse",
						"**:data-tool:hover:bg-bg-850/30 **:data-tool:p-[4px] **:data-tool:rounded-[4px]",
						"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
						"**:data-tool:data-[disabled]:opacity-40 **:data-tool:data-[disabled]:cursor-not-allowed **:data-tool:data-[disabled]:hover:bg-transparent",
						"**:data-icon:w-[24px] **:data-icon:h-[24px] **:data-icon:text-inverse ",
					)}
					value={selectedTool?.action}
					onValueChange={(value) => {
						if (isToolAction(value)) {
							switch (value) {
								case "selectLanguageModel":
									setSelectedTool(selectLanguageModelTool());
									break;
								case "selectFileNodeCategory":
									setSelectedTool(selectFileNodeCategoryTool());
									break;
								case "selectTrigger":
									if (hasAppRequestNode) {
										return;
									}
									setSelectedTool(addNodeTool(createAppEntryNode()));
									break;
								case "selectGithubTrigger":
									setSelectedTool(selectGithubTriggerTool());
									break;
								case "selectIntegration":
									setSelectedTool(selectIntegrationTool());
									break;
								case "selectContext":
									setSelectedTool(selectContextTool());
									break;
								case "selectLanguageModelV2":
									setSelectedTool(selectLanguageModelV2Tool());
									break;
							}
						}
					}}
				>
					{stage && (
						<ToggleGroup.Item
							value="selectTrigger"
							data-tool
							className="relative order-1"
							disabled={isStageFlowAlreadyPlaced}
						>
							<Tooltip text={<TooltipAndHotkey text="App" hotkey="a" />}>
								<HammerIcon data-icon />
							</Tooltip>
						</ToggleGroup.Item>
					)}

					<ToggleGroup.Item
						value="selectIntegration"
						data-tool
						className="relative order-4"
					>
						<Tooltip text={<TooltipAndHotkey text="Event" hotkey="e" />}>
							<CableIcon data-icon />
						</Tooltip>
						{selectedTool?.action === "selectIntegration" && (
							<Popover.Root open={true}>
								<Popover.Anchor />
								<Popover.Portal>
									<Popover.Content
										className={clsx(
											"relative rounded-[8px] px-[8px] py-[8px] min-w-[200px]",
											"text-inverse overflow-hidden",
										)}
										sideOffset={42}
									>
										<div
											className="absolute inset-0 -z-10 rounded-[8px] pointer-events-none"
											style={{
												backgroundColor:
													"color-mix(in srgb, var(--color-background, #00020b) 50%, transparent)",
											}}
										/>
										<GlassSurfaceLayers
											radiusClass="rounded-[8px]"
											borderStyle="solid"
											withBaseFill={false}
											blurClass="backdrop-blur-md"
											zIndexClass="z-0"
										/>

										<div className="relative flex flex-col gap-0">
											<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] mb-[4px] px-[8px]">
												Trigger
											</p>
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-[rgba(222,233,242,0.10)]",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={() => {
													setSelectedTool(
														addNodeTool(createTriggerNode("github")),
													);
												}}
											>
												<ToggleGroup.Item
													value="github-trigger"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<GitHubIcon className="size-[20px] shrink-0" />
													<p className="text-[14px]">GitHub Trigger</p>
												</ToggleGroup.Item>
											</ToggleGroup.Root>

											<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] mt-[8px] mb-[4px] px-[8px]">
												Action
											</p>
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-[rgba(222,233,242,0.10)]",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={() => {
													setSelectedTool(
														addNodeTool(createActionNode("github")),
													);
												}}
											>
												<ToggleGroup.Item
													value="github-action"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<GitHubIcon className="size-[20px] shrink-0" />
													<p className="text-[14px]">GitHub Action</p>
												</ToggleGroup.Item>
											</ToggleGroup.Root>
										</div>
									</Popover.Content>
								</Popover.Portal>
							</Popover.Root>
						)}
					</ToggleGroup.Item>

					<ToggleGroup.Item
						value="selectContext"
						data-tool
						className="relative order-3"
					>
						<Tooltip text={<TooltipAndHotkey text="Context" hotkey="c" />}>
							<Layers2Icon data-icon />
						</Tooltip>
						{selectedTool?.action === "selectContext" && (
							<Popover.Root open={true}>
								<Popover.Anchor />
								<Popover.Portal>
									<Popover.Content
										className={clsx(
											"relative rounded-[8px] px-[8px] py-[8px]",
											"text-inverse overflow-hidden",
										)}
										sideOffset={42}
									>
										<div
											className="absolute inset-0 -z-10 rounded-[8px] pointer-events-none"
											style={{
												backgroundColor:
													"color-mix(in srgb, var(--color-background, #00020b) 50%, transparent)",
											}}
										/>
										<GlassSurfaceLayers
											radiusClass="rounded-[8px]"
											borderStyle="solid"
											withBaseFill={false}
											blurClass="backdrop-blur-lg"
											zIndexClass="z-0"
										/>
										<div className="relative flex flex-col gap-0">
											<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] mb-[4px] px-[8px]">
												Source
											</p>
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-[rgba(222,233,242,0.10)]",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={(sourceType) => {
													if (sourceType === "text") {
														setSelectedTool(addNodeTool(createTextNode()));
													} else if (sourceType === "pdf") {
														setSelectedTool(
															addNodeTool(
																createFileNode(FileCategory.parse("pdf")),
															),
														);
													} else if (sourceType === "image") {
														setSelectedTool(
															addNodeTool(
																createFileNode(FileCategory.parse("image")),
															),
														);
													} else if (sourceType === "textFile") {
														setSelectedTool(
															addNodeTool(
																createFileNode(FileCategory.parse("text")),
															),
														);
													} else if (sourceType === "webPage") {
														setSelectedTool(addNodeTool(createWebPageNode()));
													}
												}}
											>
												<ToggleGroup.Item
													value="text"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<PromptIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Plain Text</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item
													value="pdf"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<PdfFileIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">PDF Upload</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item
													value="image"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<PictureIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Image Upload</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item
													value="textFile"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<TextFileIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Text Upload</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item
													value="webPage"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<WebPageFileIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Webpage</p>
												</ToggleGroup.Item>
											</ToggleGroup.Root>
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-[rgba(222,233,242,0.10)]",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={(sourceType) => {
													if (sourceType === "githubVectorStore") {
														setSelectedTool(
															addNodeTool(createGitHubVectorStoreNode()),
														);
													} else if (sourceType === "documentVectorStore") {
														setSelectedTool(
															addNodeTool(createDocumentVectorStoreNode()),
														);
													}
												}}
											>
												<ToggleGroup.Item
													value="documentVectorStore"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<DocumentVectorStoreIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Document Vector Store</p>
												</ToggleGroup.Item>
												<ToggleGroup.Item
													value="githubVectorStore"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<GitHubIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">GitHub Vector Store</p>
												</ToggleGroup.Item>
											</ToggleGroup.Root>

											<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] mt-[8px] mb-[4px] px-[8px]">
												Retrieval
											</p>
											<ToggleGroup.Root
												type="single"
												className={clsx(
													"flex flex-col gap-[8px]",
													"**:data-tool:flex **:data-tool:rounded-[8px] **:data-tool:items-center **:data-tool:w-full",
													"**:data-tool:select-none **:data-tool:outline-none **:data-tool:px-[8px] **:data-tool:py-[4px] **:data-tool:gap-[8px] **:data-tool:hover:bg-[rgba(222,233,242,0.10)]",
													"**:data-tool:data-[state=on]:bg-primary-900 **:data-tool:focus:outline-none",
												)}
												onValueChange={(sourceType) => {
													switch (sourceType) {
														case "query":
															setSelectedTool(addNodeTool(createQueryNode()));
															break;
													}
												}}
											>
												<ToggleGroup.Item
													value="query"
													data-tool
													className="hover:bg-[rgba(222,233,242,0.10)]"
												>
													<DatabaseZapIcon className="w-[20px] h-[20px]" />
													<p className="text-[14px]">Query</p>
												</ToggleGroup.Item>
											</ToggleGroup.Root>
										</div>
									</Popover.Content>
								</Popover.Portal>
							</Popover.Root>
						)}
					</ToggleGroup.Item>

					{!generateContentNode && (
						<ToggleGroup.Item
							value="selectLanguageModel"
							data-tool
							className="relative order-2"
						>
							<Tooltip text={<TooltipAndHotkey text="Model" hotkey="m" />}>
								<SparklesIcon data-icon />
							</Tooltip>
							{selectedTool?.action === "selectLanguageModel" && (
								<Popover.Root open={true}>
									<Popover.Anchor />
									<Popover.Portal>
										<Popover.Content
											className={clsx(
												"relative rounded-[8px] px-[8px] py-[8px] w-[var(--language-model-toggle-group-popover-width)]",
												"text-inverse overflow-hidden",
											)}
											align="end"
											sideOffset={42}
										>
											<div
												className="absolute inset-0 -z-10 rounded-[8px] pointer-events-none"
												style={{
													backgroundColor:
														"color-mix(in srgb, var(--color-background, #00020b) 50%, transparent)",
												}}
											/>
											<GlassSurfaceLayers
												radiusClass="rounded-[8px]"
												borderStyle="solid"
												withBaseFill={false}
												blurClass="backdrop-blur-lg"
												zIndexClass="z-0"
											/>
											<div className="relative flex flex-col gap-[8px] max-h-[280px] overflow-y-auto">
												{/* Search box */}
												<div className="flex h-[28px] p-[8px] items-center gap-[11px] self-stretch rounded-[8px] bg-[rgba(222,233,242,0.20)] mx-[4px] mb-[4px]">
													<div className="text-text-muted">
														<svg
															width="18"
															height="18"
															viewBox="0 0 24 24"
															fill="none"
															xmlns="http://www.w3.org/2000/svg"
															role="img"
															aria-labelledby="searchIconTitle"
														>
															<title id="searchIconTitle">Search Icon</title>
															<path
																d="M21 21L15.5 15.5M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
																stroke="currentColor"
																strokeWidth="2"
																strokeLinecap="round"
																strokeLinejoin="round"
															/>
														</svg>
													</div>
													<input
														type="text"
														placeholder="Search LLM Model..."
														className="w-full bg-transparent border-none text-inverse text-[12px] placeholder:text-link-muted focus:outline-none"
														value={searchQuery}
														onChange={(e) => setSearchQuery(e.target.value)}
													/>
												</div>

												{/* Tabs displayed after the search box */}
												<div className="mx-[4px] mb-[6px]">
													<div className="flex items-center rounded-md gap-2">
														<button
															type="button"
															className={`flex px-[8px] py-0 justify-center items-center gap-[10px] ${
																selectedCategory === "All"
																	? "bg-text-secondary"
																	: "hover:bg-ghost-element-hover"
															} text-inverse rounded text-[12px] font-medium leading-[170%]`}
															onClick={() => setSelectedCategory("All")}
														>
															All
														</button>
														<button
															type="button"
															className={`flex px-[8px] py-0 justify-center items-center gap-[10px] ${
																selectedCategory === "Text"
																	? "bg-text-secondary"
																	: "hover:bg-ghost-element-hover"
															} text-inverse rounded text-[12px] font-medium leading-[170%]`}
															onClick={() => setSelectedCategory("Text")}
														>
															Text
														</button>
														<button
															type="button"
															className={`flex px-[8px] py-0 justify-center items-center gap-[10px] ${
																selectedCategory === "Image"
																	? "bg-text-secondary"
																	: "hover:bg-ghost-element-hover"
															} text-inverse rounded text-[12px] font-medium leading-[170%]`}
															onClick={() => setSelectedCategory("Image")}
														>
															Image
														</button>
														<button
															type="button"
															className="flex px-[8px] py-0 justify-center items-center gap-[10px] text-text-muted rounded text-[12px] font-medium leading-[170%] opacity-50 cursor-not-allowed"
														>
															Video
														</button>
														<button
															type="button"
															className="flex px-[8px] py-0 justify-center items-center gap-[10px] text-text-muted rounded text-[12px] font-medium leading-[170%] opacity-50 cursor-not-allowed"
														>
															Audio
														</button>
													</div>
												</div>

												<div className="mt-[0px] mx-[4px]">
													{selectedCategory === "All" &&
														searchQuery.trim() === "" && (
															<>
																<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] mb-[4px]">
																	Recommended models
																</p>
																{/* Display recommended models */}
																{recommendedModels.length > 0 && (
																	<div className="flex flex-col gap-[4px] mb-[12px]">
																		{recommendedModels.map(renderModelButton)}
																	</div>
																)}

																{/* Divider */}
																<div className="flex my-[12px] mx-auto w-[90%] py-0 flex-col items-center border-b border-[#505D7B]/20" />
															</>
														)}

													{/* Flat list of models with filtering applied */}
													<div className="flex flex-col gap-[4px] max-h-[200px] overflow-y-auto pr-[4px]">
														{filteredModels.length > 0 ? (
															filteredModels.map(renderModelButton)
														) : (
															<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] p-[8px] text-center">
																No matching models found
															</p>
														)}
													</div>
												</div>
											</div>
										</Popover.Content>
									</Popover.Portal>
								</Popover.Root>
							)}
							<div className="absolute left-[calc(var(--language-model-detail-panel-width)/2_+_var(--language-model-toggle-group-popover-width)/2_-_var(--language-model-detail-panel-width)/2_+_10px)]">
								<div className="relative">
									{selectedTool?.action === "selectLanguageModel" && (
										<Popover.Root open={true}>
											<Popover.Anchor />
											<Popover.Portal>
												<Popover.Content
													className="relative overflow-hidden w-[var(--language-model-detail-panel-width)] rounded-[8px] px-[8px] py-[8px] text-inverse"
													sideOffset={42}
													onOpenAutoFocus={(e) => {
														e.preventDefault();
													}}
													onMouseEnter={handleCapabilityPanelEnter}
													onMouseLeave={handleCapabilityPanelLeave}
												>
													<div
														className="absolute inset-0 -z-10 rounded-[8px] pointer-events-none"
														style={{
															backgroundColor:
																"color-mix(in srgb, var(--color-background, #00020b) 60%, transparent)",
														}}
													/>
													<GlassSurfaceLayers
														radiusClass="rounded-[8px]"
														borderStyle="solid"
														withBaseFill={false}
														blurClass="backdrop-blur-md"
														zIndexClass="z-0"
													/>
													{/* Pro plan overlay for free users */}
													{languageModelMouseHovered &&
														isProModelForFreeUser(
															languageModelMouseHovered,
															userTier,
														) && (
															<div
																role="tooltip"
																className="absolute inset-[2px] z-10 backdrop-blur-sm rounded-[6px] flex items-center justify-center"
																style={{
																	backgroundColor:
																		"color-mix(in srgb, var(--color-background, #00020b) 80%, transparent)",
																}}
															>
																<div className="text-center">
																	<p className="text-blue-400 text-[14px] font-medium mb-3">
																		This model is available on Pro plan
																	</p>
																	<button
																		type="button"
																		className="text-blue-400 hover:text-blue-300 border border-blue-400 hover:border-blue-300 text-[12px] px-4 py-2 rounded-[6px] font-medium transition-colors"
																		onClick={() => {
																			window.open("/settings/team", "_blank");
																		}}
																	>
																		Upgrade to Pro
																	</button>
																</div>
															</div>
														)}
													<div className="relative text-inverse h-[200px]">
														{languageModelMouseHovered ? (
															<div className="px-[16px] py-[16px] flex flex-col gap-[24px]">
																<div className="flex items-start gap-[16px]">
																	<div className="flex items-center shrink-0">
																		<ProviderIcon
																			model={languageModelMouseHovered}
																			className="size-[24px]"
																		/>
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
																	{hasCapability(
																		languageModelMouseHovered,
																		Capability.ImageGenerationInput,
																	) && (
																		<CapabilityIcon
																			icon={
																				<PictureIcon
																					data-icon
																					className="w-[16px] h-[16px]"
																				/>
																			}
																		>
																			Input Image Generation
																		</CapabilityIcon>
																	)}
																</div>
															</div>
														) : (
															<div className="flex h-full items-center justify-center">
																<p className="text-[14px] text-text-muted text-center">
																	Hover over a model to view details
																</p>
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
					)}

					{generateContentNode && (
						<ToggleGroup.Item
							value="selectLanguageModelV2"
							data-tool
							className="relative order-2"
						>
							<Tooltip text={<TooltipAndHotkey text="Model" hotkey="m" />}>
								<SparklesIcon data-icon />
							</Tooltip>
							{selectedTool?.action === "selectLanguageModelV2" && (
								<Popover.Root open={true}>
									<Popover.Anchor />
									<Popover.Portal>
										<Popover.Content
											className={clsx(
												"relative rounded-[8px] px-[8px] py-[8px] w-[var(--language-model-toggle-group-popover-width)]",
												"text-inverse overflow-hidden",
											)}
											align="end"
											sideOffset={42}
										>
											<LanguageModelV2ToggleGroup
												userTier={userTier}
												onValueChange={(modelId) => {
													setSelectedTool(
														addNodeTool(
															createContentGenerationNode({ id: modelId }),
														),
													);
												}}
											/>
										</Popover.Content>
									</Popover.Portal>
								</Popover.Root>
							)}
							<div className="absolute left-[calc(var(--language-model-detail-panel-width)/2_+_var(--language-model-toggle-group-popover-width)/2_-_var(--language-model-detail-panel-width)/2_+_10px)]">
								<div className="relative">
									{selectedTool?.action === "selectLanguageModelV2" && (
										<Popover.Root open={true}>
											<Popover.Anchor />
											<Popover.Portal>
												<Popover.Content
													className="relative overflow-hidden w-[var(--language-model-detail-panel-width)] rounded-[8px] px-[8px] py-[8px] text-inverse"
													sideOffset={42}
													onOpenAutoFocus={(e) => e.preventDefault()}
												>
													<LanguageModelMegaTooltip userTier={userTier} />
												</Popover.Content>
											</Popover.Portal>
										</Popover.Root>
									)}
								</div>
							</div>
						</ToggleGroup.Item>
					)}

					{/* Trigger/Action are grouped under Connect, and retrieval is under Context. */}
				</ToggleGroup.Root>
			</div>
		</div>
	);
}
