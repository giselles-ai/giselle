import { ModelPicker } from "@giselle-internal/ui/model-picker";
import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
// unified into ModelPicker
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import {
	type AnthropicLanguageModelData,
	type GoogleLanguageModelData,
	type Node,
	type OpenAILanguageModelData,
	OutputId,
} from "@giselle-sdk/data-type";
import {
	useFeatureFlag,
	useUsageLimits,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import {
	anthropicLanguageModels,
	googleLanguageModels,
	hasTierAccess,
	type LanguageModel,
	openaiLanguageModels,
	Tier,
} from "@giselle-sdk/language-model";
import { ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ProTag } from "../../tool/toolbar/components/pro-tag";
import { AnthropicModelPanel } from "./model/anthropic";
import { GoogleModelPanel } from "./model/google";
import { OpenAIModelPanel } from "./model/openai";
import { createDefaultModelData, updateModelId } from "./model-defaults";
import { useConnectedOutputs } from "./outputs";
import { ToolsPanel } from "./tools/tools-panel";

export type PromptPanelSections = {
	modelPicker?: boolean;
	modelParameters?: boolean;
	advancedOptions?: boolean;
	promptLabel?: boolean;
};

export type PromptPanelSlots = {
	headerActions?: React.ReactNode;
	uploadArea?: React.ReactNode;
	footer?: React.ReactNode;
};

function useModelGroups(userTier: Tier) {
	return useMemo(() => {
		const toModelPickerModels = (models: LanguageModel[]) =>
			models.map((model) => {
				const disabled = !hasTierAccess(model, userTier);
				return {
					id: model.id,
					label: model.id,
					badge: model.tier === Tier.enum.pro ? <ProTag /> : undefined,
					disabled,
					disabledReason: disabled
						? "Upgrade to Pro to use this model."
						: undefined,
				};
			});

		return [
			{
				provider: "openai",
				label: "OpenAI",
				models: toModelPickerModels(openaiLanguageModels),
			},
			{
				provider: "anthropic",
				label: "Anthropic",
				models: toModelPickerModels(anthropicLanguageModels),
			},
			{
				provider: "google",
				label: "Google",
				models: toModelPickerModels(googleLanguageModels),
			},
		];
	}, [userTier]);
}

export function PromptPanel({
	node,
	sections,
	slots,
	onExpand,
	editorVersion,
}: {
	node: TextGenerationNode;
	sections?: PromptPanelSections;
	slots?: PromptPanelSlots;
	onExpand?: () => void;
	editorVersion?: number;
}) {
	const updateNodeDataContent = useWorkflowDesignerStore(
		(s) => s.updateNodeDataContent,
	);
	const updateNodeData = useWorkflowDesignerStore((s) => s.updateNodeData);
	const deleteConnection = useWorkflowDesignerStore((s) => s.deleteConnection);
	const data = useWorkflowDesignerStore((s) => s.workspace);
	const { all: connectedSources } = useConnectedOutputs(node);
	const { googleUrlContext } = useFeatureFlag();
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const usageLimits = useUsageLimits();
	const userTier = usageLimits?.featureTier ?? Tier.enum.free;
	const groups = useModelGroups(userTier);

	// provider/model selects replaced by ModelPicker

	// modelOptions removed

	function handleOpenAIWebSearchChange(enable: boolean) {
		const hasSource = node.outputs.some((o) => o.accessor === "source");
		let nextOutputs = node.outputs;
		if (enable) {
			if (!hasSource) {
				nextOutputs = [
					...node.outputs,
					{ id: OutputId.generate(), label: "Source", accessor: "source" },
				];
			}
		} else if (hasSource) {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (sourceOutput) {
				for (const connection of data.connections) {
					if (connection.outputId !== sourceOutput.id) continue;
					deleteConnection(connection.id);
					const connectedNode = data.nodes.find(
						(n) => n.id === connection.inputNode.id,
					);
					if (!connectedNode) continue;
					if (connectedNode.type === "operation") {
						switch (connectedNode.content.type) {
							case "textGeneration":
							case "imageGeneration": {
								updateNodeData(
									connectedNode as unknown as Node,
									{
										inputs: connectedNode.inputs.filter(
											(i) => i.id !== connection.inputId,
										),
									} as Partial<Node>,
								);
								break;
							}
							default:
								break;
						}
					}
				}
			}
			nextOutputs = node.outputs.filter((o) => o.accessor !== "source");
		}
		updateNodeData(
			node as unknown as Node,
			{ outputs: nextOutputs } as Partial<Node>,
		);
	}

	function handleGoogleSearchGroundingChange(enable: boolean) {
		const currentUrlContext =
			(
				node.content.llm.configurations as {
					urlContext?: boolean;
				}
			).urlContext ?? false;
		const nextUrlContext = enable ? false : currentUrlContext;
		let outputs = node.outputs;
		const hasSource = node.outputs.some((o) => o.accessor === "source");
		if (enable || nextUrlContext) {
			if (!hasSource)
				outputs = [
					...node.outputs,
					{ id: OutputId.generate(), label: "Source", accessor: "source" },
				];
		} else {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (sourceOutput) {
				for (const c of data.connections) {
					if (c.outputId !== sourceOutput.id) continue;
					deleteConnection(c.id);
				}
			}
			outputs = node.outputs.filter((o) => o.accessor !== "source");
		}
		updateNodeData(
			node as unknown as Node,
			{
				content: {
					...node.content,
					llm: {
						...node.content.llm,
						configurations: {
							...node.content.llm.configurations,
							searchGrounding: enable,
							urlContext: nextUrlContext,
						},
					},
				},
				outputs,
			} as Partial<Node>,
		);
	}

	function handleGoogleUrlContextChange(enable: boolean) {
		if (!googleUrlContext) return;
		const currentSearchGrounding =
			(
				node.content.llm.configurations as {
					searchGrounding?: boolean;
				}
			).searchGrounding ?? false;
		const nextSearchGrounding = enable ? false : currentSearchGrounding;
		let outputs = node.outputs;
		const hasSource = node.outputs.some((o) => o.accessor === "source");
		if (enable || nextSearchGrounding) {
			if (!hasSource)
				outputs = [
					...node.outputs,
					{ id: OutputId.generate(), label: "Source", accessor: "source" },
				];
		} else {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (sourceOutput) {
				for (const c of data.connections) {
					if (c.outputId !== sourceOutput.id) continue;
					deleteConnection(c.id);
				}
			}
			outputs = node.outputs.filter((o) => o.accessor !== "source");
		}
		updateNodeData(
			node as unknown as Node,
			{
				content: {
					...node.content,
					llm: {
						...node.content.llm,
						configurations: {
							...node.content.llm.configurations,
							searchGrounding: nextSearchGrounding,
							urlContext: enable,
						},
					},
				},
				outputs,
			} as Partial<Node>,
		);
	}

	const resolvedSections: Required<PromptPanelSections> = {
		modelPicker: sections?.modelPicker ?? true,
		modelParameters: sections?.modelParameters ?? true,
		advancedOptions: sections?.advancedOptions ?? true,
		promptLabel: sections?.promptLabel ?? true,
	};

	const header = (
		<div className="flex flex-col gap-[8px]">
			<div className="col-span-2">
				<div className="flex items-center justify-between gap-[12px]">
					<label htmlFor="model-picker-trigger" className="sr-only">
						Model
					</label>
					{resolvedSections.modelPicker && (
						<>
							<SettingDetail size="md">Model</SettingDetail>
							<ModelPicker
								currentProvider={node.content.llm.provider}
								currentModelId={node.content.llm.id}
								groups={groups}
								fullWidth={false}
								triggerId="model-picker-trigger"
								onSelect={(provider, modelId) => {
									const next = createDefaultModelData(
										provider as "openai" | "anthropic" | "google",
									);
									const updated = updateModelId(next, modelId);
									updateNodeDataContent(node, { llm: updated, tools: {} });
								}}
							/>
						</>
					)}
					{slots?.headerActions}
				</div>
			</div>
			{resolvedSections.modelParameters && (
				<>
					<SettingLabel>Model parameters</SettingLabel>
					<div className="col-span-2 flex flex-col gap-[12px]">
						{node.content.llm.provider === "openai" && (
							<OpenAIModelPanel
								openaiLanguageModel={
									node.content.llm as OpenAILanguageModelData
								}
								tools={node.content.tools}
								onModelChange={(value) =>
									updateNodeDataContent(node, { llm: value })
								}
								onToolChange={(changedTool) =>
									updateNodeDataContent(node, { tools: changedTool })
								}
								onWebSearchChange={handleOpenAIWebSearchChange}
							/>
						)}
						{node.content.llm.provider === "google" && (
							<GoogleModelPanel
								googleLanguageModel={
									node.content.llm as GoogleLanguageModelData
								}
								onSearchGroundingConfigurationChange={
									handleGoogleSearchGroundingChange
								}
								onUrlContextConfigurationChange={handleGoogleUrlContextChange}
								onModelChange={(value) =>
									updateNodeDataContent(node, { llm: value })
								}
							/>
						)}
						{node.content.llm.provider === "anthropic" && (
							<AnthropicModelPanel
								anthropicLanguageModel={
									node.content.llm as AnthropicLanguageModelData
								}
								onModelChange={(value) =>
									updateNodeDataContent(node, { llm: value })
								}
							/>
						)}
					</div>
				</>
			)}
			{resolvedSections.promptLabel && (
				<SettingLabel inline>Prompt</SettingLabel>
			)}
		</div>
	);

	const advancedOptions = (
		<div className="col-span-2 rounded-[8px] bg-inverse/5 px-[8px] py-[8px] mt-[8px]">
			<button
				type="button"
				onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
				className="flex items-center gap-[8px] w-full text-left text-inverse hover:text-primary-900 transition-colors"
			>
				<ChevronRightIcon
					className={`size-[14px] text-secondary transition-transform ${isAdvancedOpen ? "rotate-90" : ""}`}
				/>
				<SettingLabel inline className="mb-0">
					Advanced options
				</SettingLabel>
			</button>
			{isAdvancedOpen && (
				<div className="mt-[12px]">
					{/* Optional upload area slot */}
					{slots?.uploadArea}
					<SettingDetail className="mb-[6px]">Tools</SettingDetail>
					<ToolsPanel node={node} />
				</div>
			)}
		</div>
	);

	return (
		<>
			<PromptEditor
				key={`${editorVersion ?? 0}-${JSON.stringify(connectedSources.map((c) => c.node.id))}`}
				placeholder="Write your prompt here..."
				value={node.content.prompt}
				onValueChange={(value) => {
					updateNodeDataContent(node, { prompt: value });
				}}
				nodes={connectedSources.map((source) => source.node)}
				connectedSources={connectedSources.map(
					({ node: n, id, label, accessor }) => ({
						node: n,
						output: { id, label, accessor },
					}),
				)}
				showToolbar={false}
				variant="plain"
				header={header}
				showExpandIcon={true}
				onExpand={onExpand}
				expandIconPosition="right"
			/>
			{resolvedSections.advancedOptions && advancedOptions}
		</>
	);
}
