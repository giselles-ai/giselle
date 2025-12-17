import { useToasts } from "@giselle-internal/ui/toast";
import {
	falLanguageModels,
	googleImageLanguageModels,
	hasTierAccess,
	openaiImageModels,
	Tier,
} from "@giselles-ai/language-model";
import type {
	ImageGenerationLanguageModelData,
	ImageGenerationNode,
} from "@giselles-ai/protocol";
import {
	isSupportedConnection,
	useFeatureFlag,
	useUsageLimits,
} from "@giselles-ai/react";
import { useCallback, useMemo } from "react";
import { useAppDesignerStore } from "../../../app-designer/store/hooks";
import {
	useDeleteConnection,
	useUpdateNodeData,
	useUpdateNodeDataContent,
} from "../../../app-designer/store/usecases";
import { ModelPicker } from "../../../ui/model-picker";
import { ProTag } from "../../tool/toolbar/components/pro-tag";
import { PromptEditor } from "../ui/prompt-editor";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { createDefaultModelData, updateModelId } from "./model-defaults";
import { FalModelPanel, OpenAIImageModelPanel } from "./models";
import { useConnectedSources } from "./sources";

export function PromptPanel({ node }: { node: ImageGenerationNode }) {
	const { nodes, connections: allConnections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));
	const updateNodeDataContent = useUpdateNodeDataContent();
	const updateNodeData = useUpdateNodeData();
	const deleteConnection = useDeleteConnection();
	const usageLimits = useUsageLimits();
	const userTier = usageLimits?.featureTier ?? Tier.enum.free;
	const { error } = useToasts();
	const { aiGatewayUnsupportedModels } = useFeatureFlag();
	const { connections } = useConnectedSources(node);
	const selectableOpenAIImageModels = useMemo(
		() =>
			openaiImageModels.filter(
				(model) => aiGatewayUnsupportedModels || model.id !== "gpt-image-1",
			),
		[aiGatewayUnsupportedModels],
	);

	const groups = useMemo(
		() => [
			{
				provider: "fal",
				label: "Fal",
				models: falLanguageModels.map((m) => ({
					id: m.id,
					badge: m.tier === Tier.enum.pro ? <ProTag /> : undefined,
					disabled: !hasTierAccess(m, userTier),
				})),
			},
			{
				provider: "openai",
				label: "OpenAI",
				models: selectableOpenAIImageModels.map((m) => {
					const disabledByTier = !hasTierAccess(m, userTier);
					return {
						id: m.id,
						badge: m.tier === Tier.enum.pro ? <ProTag /> : undefined,
						disabled: disabledByTier,
						disabledReason: disabledByTier ? "Pro only" : undefined,
					};
				}),
			},
			{
				provider: "google",
				label: "Google",
				models: googleImageLanguageModels.map((m) => ({
					id: m.id,
					badge: m.tier === Tier.enum.pro ? <ProTag /> : undefined,
					disabled: !hasTierAccess(m, userTier),
					disabledReason: !hasTierAccess(m, userTier) ? "Pro only" : undefined,
				})),
			},
		],
		[userTier, selectableOpenAIImageModels],
	);

	const disconnectInvalidConnections = useCallback(
		(model: ImageGenerationLanguageModelData) => {
			const connections = allConnections.filter(
				(c) => c.inputNode.id === node.id,
			);
			if (connections.length === 0) return;
			const newInputNode = {
				...node,
				content: { ...node.content, llm: model },
			};
			for (const connection of connections) {
				const outputNode = nodes.find((n) => n.id === connection.outputNode.id);
				if (!outputNode) continue;
				if (!isSupportedConnection(outputNode, newInputNode).canConnect) {
					deleteConnection(connection.id);
				}
			}
		},
		[allConnections, deleteConnection, node, nodes],
	);

	const header = (
		<div className="flex flex-col gap-[8px]">
			<div className="col-span-2">
				<div className="flex items-center justify-between gap-[12px]">
					<label htmlFor="image-model-picker-trigger" className="sr-only">
						Model
					</label>
					<SettingDetail size="md">Model</SettingDetail>
					<ModelPicker
						currentProvider={node.content.llm.provider}
						currentModelId={node.content.llm.id}
						groups={groups}
						fullWidth={false}
						triggerId="image-model-picker-trigger"
						onSelect={(provider, modelId) => {
							if (!aiGatewayUnsupportedModels && provider === "openai") {
								error("GPT-Image 1 is unavailable via AI Gateway.");
								return;
							}
							const model =
								provider === "fal"
									? falLanguageModels.find((m) => m.id === modelId)
									: provider === "openai"
										? selectableOpenAIImageModels.find((m) => m.id === modelId)
										: googleImageLanguageModels.find((m) => m.id === modelId);
							if (!model) return;
							if (!hasTierAccess(model, userTier)) {
								error("Please upgrade to Pro to use this model.");
								return;
							}
							const next = createDefaultModelData(
								provider as "fal" | "openai" | "google",
							);
							const updated = updateModelId(next, modelId);
							disconnectInvalidConnections(updated);
							updateNodeData(node, {
								content: { ...node.content, llm: updated },
							});
						}}
					/>
				</div>
			</div>
			<SettingLabel>Model parameters</SettingLabel>
			{node.content.llm.provider === "fal" && (
				<FalModelPanel
					languageModel={node.content.llm}
					onModelChange={(value) => updateNodeDataContent(node, { llm: value })}
				/>
			)}
			{node.content.llm.provider === "openai" && (
				<OpenAIImageModelPanel
					languageModel={node.content.llm}
					onModelChange={(value) => updateNodeDataContent(node, { llm: value })}
				/>
			)}
			<SettingLabel inline>Prompt</SettingLabel>
		</div>
	);

	return (
		<PromptEditor
			placeholder="Write your prompt... Use @ to reference other nodes"
			value={node.content.prompt}
			onValueChange={(value: string) => {
				updateNodeDataContent(node, { prompt: value });
			}}
			connections={connections}
			header={header}
		/>
	);
}
