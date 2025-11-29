import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	anthropicLanguageModels,
	googleLanguageModels,
	hasTierAccess,
	type LanguageModel,
	openaiLanguageModels,
	Tier,
} from "@giselles-ai/language-model";
import type { TextGenerationNode } from "@giselles-ai/protocol";
import {
	useNodeGenerations,
	useUsageLimits,
	useWorkflowDesigner,
} from "@giselles-ai/react";
import { useCallback, useEffect, useMemo } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { ModelPicker } from "../../../ui/model-picker";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import { ProTag } from "../../tool";
import { PropertiesPanelRoot } from "../ui";
import { GenerateCtaButton } from "../ui/generate-cta-button";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GenerationPanel } from "./generation-panel";
import { createDefaultModelData, updateModelId } from "./model-defaults";
import { useConnectedOutputs } from "./outputs";

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

export function TextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { data, updateNodeData, updateNodeDataContent, deleteNode } =
		useWorkflowDesigner();
	const captureOpts: AddEventListenerOptions = { capture: true };
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId: data.id },
		});
	const { all: connectedSources, connections } = useConnectedOutputs(node);
	const sourceNodes = useMemo(
		() => connectedSources.map((c) => c.node),
		[connectedSources],
	);
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();

	useKeyboardShortcuts({
		onGenerate: () => {
			if (!isGenerating) {
				generateText();
			}
		},
	});

	const generateText = useCallback(() => {
		if (usageLimitsReached) {
			error("Please upgrade your plan to continue using this feature.");
			return;
		}
		if (isPromptEmpty(node.content.prompt)) {
			error("Please fill in the prompt to run.");
			return;
		}

		createAndStartGenerationRunner({
			origin: {
				type: "studio",
				workspaceId: data.id,
			},
			operationNode: node,
			sourceNodes,
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		sourceNodes,
		data.id,
		data.connections,
		node,
		createAndStartGenerationRunner,
		usageLimitsReached,
		error,
	]);

	useEffect(() => {
		const onKeydown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				generateText();
			}
		};
		window.addEventListener("keydown", onKeydown, captureOpts);
		return () => window.removeEventListener("keydown", onKeydown, captureOpts);
	}, [generateText]);

	const usageLimits = useUsageLimits();
	const groups = useModelGroups(usageLimits?.featureTier ?? Tier.enum.free);

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>

			{/*<PropertiesPanelContent>*/}
			<div className="grow-1 overflow-y-auto flex flex-col gap-[12px]">
				<div className="flex items-center justify-between gap-[12px]">
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
				</div>
				<PromptEditor
					placeholder="Write your prompt... Use @ to reference other nodes"
					value={node.content.prompt}
					onValueChange={(value) => {
						updateNodeDataContent(node, { prompt: value });
					}}
					connections={connections}
					showToolbar={false}
					variant="plain"
					showExpandIcon={false}
				/>
				<div className="flex flex-col gap-[4px]">
					<SettingLabel>Output</SettingLabel>
					<GenerationPanel node={node} onClickGenerateButton={generateText} />
				</div>
			</div>
			<div className="shrink-0 px-[16px] pt-[8px] pb-[4px]">
				<GenerateCtaButton
					isGenerating={isGenerating}
					isEmpty={isPromptEmpty(node.content.prompt)}
					onClick={() => {
						if (isGenerating) stopGenerationRunner();
						else generateText();
					}}
				/>
			</div>
			{/*</PropertiesPanelContent>*/}
		</PropertiesPanelRoot>
	);
}
