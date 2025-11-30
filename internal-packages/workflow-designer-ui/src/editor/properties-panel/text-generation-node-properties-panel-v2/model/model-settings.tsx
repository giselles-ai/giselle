import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import type { LanguageModelTier } from "@giselles-ai/language-model-registry";
import {
	type AnthropicLanguageModelData,
	type Connection,
	type ContentGenerationNode,
	GoogleLanguageModelData,
	type OpenAILanguageModelData,
	OutputId,
	type TextGenerationContent,
	type TextGenerationNode,
} from "@giselles-ai/protocol";
import { useWorkflowDesignerStore } from "@giselles-ai/react";
import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { ModelPickerV2 } from "../../../../ui/model-picker-v2";
import { AnthropicModelPanel } from "./anthropic";
import { GoogleModelPanel } from "./google";
import { OpenAIModelPanel } from "./openai";

export function ModelSettings({
	node,
	textGenerationNode,
	onNodeChange,
	onTextGenerationContentChange,
	onDeleteConnection,
	userTier,
}: {
	node: ContentGenerationNode;
	textGenerationNode: TextGenerationNode;
	onNodeChange: (value: Partial<TextGenerationNode>) => void;
	onTextGenerationContentChange: (
		value: Partial<TextGenerationContent>,
	) => void;
	onDeleteConnection: (connection: Connection) => void;
	userTier: LanguageModelTier;
}) {
	const { connections } = useWorkflowDesignerStore(
		useShallow((s) => ({
			connections: s.workspace.connections,
		})),
	);

	const handleOpenAIWebSearchChange = useCallback(
		(enable: boolean) => {
			const sourceOutput = textGenerationNode.outputs.find(
				(o) => o.accessor === "source",
			);

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
						...textGenerationNode.outputs,
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
			onNodeChange({
				outputs: textGenerationNode.outputs.filter(
					(i) => i.accessor !== "source",
				),
			});
		},
		[textGenerationNode, connections, onNodeChange, onDeleteConnection],
	);

	const updateOutputForGoogle = useCallback(
		({
			urlContext,
			googleSearch,
		}: {
			urlContext: boolean;
			googleSearch: boolean;
		}) => {
			const sourceOutput = textGenerationNode.outputs.find(
				(o) => o.accessor === "source",
			);
			if (urlContext && googleSearch && sourceOutput) {
				return;
			}
			if ((urlContext || googleSearch) && sourceOutput) {
				return;
			}
			if ((urlContext || googleSearch) && !sourceOutput) {
				onNodeChange({
					outputs: [
						...textGenerationNode.outputs,
						{ id: OutputId.generate(), label: "Source", accessor: "source" },
					],
				});
				return;
			}
			for (const connection of connections) {
				if (connection.outputId !== sourceOutput?.id) {
					continue;
				}
				onDeleteConnection(connection);
			}
			onNodeChange({
				outputs: textGenerationNode.outputs.filter(
					(i) => i.accessor !== "source",
				),
			});
		},
		[onNodeChange, textGenerationNode.outputs, connections, onDeleteConnection],
	);

	const handleGoogleSearchGroundingChange = useCallback(
		(googleSearch: boolean) => {
			const result = GoogleLanguageModelData.safeParse(
				textGenerationNode.content.llm,
			);
			if (result.error) {
				console.warn(
					`Error parsing GoogleLanguageModelData: ${textGenerationNode.content.llm}`,
				);
				return;
			}
			onTextGenerationContentChange({
				llm: {
					...result.data,
					configurations: {
						...result.data.configurations,
						searchGrounding: googleSearch,
					},
				} satisfies GoogleLanguageModelData,
			});
			updateOutputForGoogle({
				urlContext: result.data.configurations.urlContext,
				googleSearch,
			});
		},
		[textGenerationNode, onTextGenerationContentChange, updateOutputForGoogle],
	);

	const handleGoogleUrlContextChange = useCallback(
		(urlContext: boolean) => {
			const result = GoogleLanguageModelData.safeParse(
				textGenerationNode.content.llm,
			);
			if (result.error) {
				console.warn(
					`Error parsing GoogleLanguageModelData: ${textGenerationNode.content.llm}`,
				);
				return;
			}
			onTextGenerationContentChange({
				llm: {
					...result.data,
					configurations: {
						...result.data.configurations,
						urlContext,
					},
				} satisfies GoogleLanguageModelData,
			});
			updateOutputForGoogle({
				urlContext,
				googleSearch: result.data.configurations.searchGrounding,
			});
		},
		[textGenerationNode, updateOutputForGoogle, onTextGenerationContentChange],
	);

	return (
		<>
			<div className="flex items-center justify-between gap-[12px]">
				<SettingDetail size="md">Model</SettingDetail>
				<ModelPickerV2
					userTier={userTier}
					value={node.content.languageModel.id}
				/>
			</div>

			<SettingLabel>Model parameters</SettingLabel>
			<div className="col-span-2 flex flex-col gap-[12px]">
				{textGenerationNode.content.llm.provider === "openai" && (
					<OpenAIModelPanel
						openaiLanguageModel={
							textGenerationNode.content.llm as OpenAILanguageModelData
						}
						tools={textGenerationNode.content.tools}
						onModelChange={(value) =>
							onTextGenerationContentChange({ llm: value })
						}
						onToolChange={(changedTool) =>
							onTextGenerationContentChange({ tools: changedTool })
						}
						onWebSearchChange={handleOpenAIWebSearchChange}
					/>
				)}
				{textGenerationNode.content.llm.provider === "google" && (
					<GoogleModelPanel
						googleLanguageModel={
							textGenerationNode.content.llm as GoogleLanguageModelData
						}
						onSearchGroundingConfigurationChange={
							handleGoogleSearchGroundingChange
						}
						onUrlContextConfigurationChange={handleGoogleUrlContextChange}
						onModelChange={(value) =>
							onTextGenerationContentChange({ llm: value })
						}
					/>
				)}
				{textGenerationNode.content.llm.provider === "anthropic" && (
					<AnthropicModelPanel
						anthropicLanguageModel={
							textGenerationNode.content.llm as AnthropicLanguageModelData
						}
						onModelChange={(value) =>
							onTextGenerationContentChange({ llm: value })
						}
					/>
				)}
			</div>
		</>
	);
}
