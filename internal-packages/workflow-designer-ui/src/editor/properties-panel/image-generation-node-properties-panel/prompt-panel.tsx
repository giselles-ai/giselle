import { ModelPicker } from "@giselle-internal/ui/model-picker";
import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import {
	type ImageGenerationLanguageModelData,
	type ImageGenerationNode,
	Node,
} from "@giselle-sdk/data-type";
import {
	isSupportedConnection,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import {
	falLanguageModels,
	googleImageLanguageModels,
	openaiImageModels,
} from "@giselle-sdk/language-model";
import { useCallback, useMemo } from "react";
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
	const { all: connectedSources } = useConnectedSources(node);
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
				models: falLanguageModels.map((m) => ({ id: m.id })),
			},
			{
				provider: "openai",
				label: "OpenAI",
				models: openaiImageModels.map((m) => ({ id: m.id })),
			},
			{
				provider: "google",
				label: "Google",
				models: googleImageLanguageModels.map((m) => ({ id: m.id })),
			},
		],
		[],
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
