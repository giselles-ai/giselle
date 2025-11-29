import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import {
	anthropicLanguageModels,
	googleLanguageModels,
	hasTierAccess,
	type LanguageModel,
	openaiLanguageModels,
	Tier,
} from "@giselles-ai/language-model";
import {
	type Connection,
	type OpenAILanguageModelData,
	OutputId,
	type TextGenerationContent,
	type TextGenerationNode,
} from "@giselles-ai/protocol";
import { useUsageLimits, useWorkflowDesignerStore } from "@giselles-ai/react";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { ModelPicker } from "../../../../ui/model-picker";
import { ProTag } from "../../../tool";
import { OpenAIModelPanel } from "./openai";

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

export function ModelSettings({
	node,
	onNodeChange,
	onModelChange,
	onTextGenerationContentChange,
	onDeleteConnection,
}: {
	node: TextGenerationNode;
	onNodeChange: (value: Partial<TextGenerationNode>) => void;
	onModelChange: ({ provider, id }: { provider: string; id: string }) => void;
	onTextGenerationContentChange: (
		value: Partial<TextGenerationContent>,
	) => void;
	onDeleteConnection: (connection: Connection) => void;
}) {
	const usageLimits = useUsageLimits();
	const groups = useModelGroups(usageLimits?.featureTier ?? Tier.enum.free);
	const { connections } = useWorkflowDesignerStore(
		useShallow((s) => ({
			connections: s.workspace.connections,
		})),
	);

	const handleOpenAIWebSearchChange = useCallback(
		(enable: boolean) => {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");

			// When enabled, add an Output for Source
			if (enable) {
				// Defensive programming: This shouldn't happen, but just in case. This check should become unnecessary once the data structure is properly organized.
				if (sourceOutput) {
					console.warn(
						"OpenAI Web Search tool was enabled while source already exists",
					);
					return;
				}
				onNodeChange({
					outputs: [
						...node.outputs,
						{ id: OutputId.generate(), label: "Source", accessor: "source" },
					],
				});
				return;
			}

			// When disabled, delete the connections to the Source Output, then remove the Output
			for (const connection of connections) {
				if (connection.outputId !== sourceOutput?.id) {
					continue;
				}
				onDeleteConnection(connection);
			}
		},
		[node, connections, onNodeChange, onDeleteConnection],
	);

	return (
		<>
			<div className="flex items-center justify-between gap-[12px]">
				<SettingDetail size="md">Model</SettingDetail>
				<ModelPicker
					currentProvider={node.content.llm.provider}
					currentModelId={node.content.llm.id}
					groups={groups}
					fullWidth={false}
					onSelect={(provider, id) => {
						onModelChange({ provider, id });
					}}
				/>
			</div>

			<SettingLabel>Model parameters</SettingLabel>
			<div className="col-span-2 flex flex-col gap-[12px]">
				{node.content.llm.provider === "openai" && (
					<OpenAIModelPanel
						openaiLanguageModel={node.content.llm as OpenAILanguageModelData}
						tools={node.content.tools}
						onModelChange={(value) =>
							onTextGenerationContentChange({ llm: value })
						}
						onToolChange={(changedTool) =>
							onTextGenerationContentChange({ tools: changedTool })
						}
						onWebSearchChange={handleOpenAIWebSearchChange}
					/>
				)}
				{/*{node.content.llm.provider === "google" && (
					<GoogleModelPanel
						googleLanguageModel={node.content.llm as GoogleLanguageModelData}
						onSearchGroundingConfigurationChange={
							handleGoogleSearchGroundingChange
						}
						onUrlContextConfigurationChange={handleGoogleUrlContextChange}
						onModelChange={(value) =>
							onTextGenerationContentChange({ llm: value })
						}
					/>
				)}
				{node.content.llm.provider === "anthropic" && (
					<AnthropicModelPanel
						anthropicLanguageModel={
							node.content.llm as AnthropicLanguageModelData
						}
						onModelChange={(value) =>
							onTextGenerationContentChange({ llm: value })
						}
					/>
				)}*/}
			</div>
		</>
	);
}
