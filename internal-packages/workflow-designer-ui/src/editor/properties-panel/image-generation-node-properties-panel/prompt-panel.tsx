import { ModelPicker } from "@giselle-internal/ui/model-picker";
import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	falLanguageModels,
	googleImageLanguageModels,
	hasTierAccess,
	openaiImageModels,
	Tier,
} from "@giselles-ai/language-model";
import {
	type ImageGenerationLanguageModelData,
	type ImageGenerationNode,
	Node,
} from "@giselles-ai/protocol";
import {
	isSupportedConnection,
	useFeatureFlag,
	useUsageLimits,
	useWorkflowDesigner,
} from "@giselles-ai/react";
import { useCallback, useMemo } from "react";
import { ProTag } from "../../tool/toolbar/components/pro-tag";
import { createDefaultModelData, updateModelId } from "./model-defaults";
import { FalModelPanel, OpenAIImageModelPanel } from "./models";
import { useConnectedSources } from "./sources";

export function PromptPanel({
	node,
	onExpand,
	editorVersion,
}: {
	node: ImageGenerationNode;
	onExpand?: () => void;
	editorVersion?: number;
}) {
	const { data, updateNodeDataContent, updateNodeData, deleteConnection } =
		useWorkflowDesigner();
	const usageLimits = useUsageLimits();
	const userTier = usageLimits?.featureTier ?? Tier.enum.free;
	const { error } = useToasts();
	const { aiGatewayUnsupportedModels } = useFeatureFlag();
	const { all: connectedSources } = useConnectedSources(node);
	const selectableOpenAIImageModels = useMemo(
		() =>
			openaiImageModels.filter(
				(model) => aiGatewayUnsupportedModels || model.id !== "gpt-image-1",
			),
		[aiGatewayUnsupportedModels],
	);
	const nodes = useMemo(
		() =>
			connectedSources
				.map((source) => Node.safeParse(source.node))
				.map((parse) => (parse.success ? parse.data : null))
				.filter((data) => data !== null),
		[connectedSources],
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
			const connections = data.connections.filter(
				(c) => c.inputNode.id === node.id,
			);
			if (connections.length === 0) return;
			const newInputNode = {
				...node,
				content: { ...node.content, llm: model },
			};
			for (const connection of connections) {
				const outputNode = data.nodes.find(
					(n) => n.id === connection.outputNode.id,
				);
				if (!outputNode) continue;
				if (!isSupportedConnection(outputNode, newInputNode).canConnect) {
					deleteConnection(connection.id);
				}
			}
		},
		[data.connections, data.nodes, node, deleteConnection],
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
			key={`${editorVersion ?? 0}-${JSON.stringify(nodes.map((n) => n.id))}`}
			placeholder="Write your prompt here..."
			value={node.content.prompt}
			onValueChange={(value) => {
				updateNodeDataContent(node, { prompt: value });
			}}
			nodes={nodes}
			connectedSources={connectedSources.map(({ node, output }) => ({
				node,
				output,
			}))}
			showToolbar={false}
			variant="plain"
			header={header}
			showExpandIcon={true}
			onExpand={onExpand}
			expandIconPosition="right"
		/>
	);
}
