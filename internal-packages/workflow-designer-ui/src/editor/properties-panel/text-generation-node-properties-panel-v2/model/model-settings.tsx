import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import type { LanguageModelTier } from "@giselles-ai/language-model-registry";
import {
	type AnthropicLanguageModelData,
	type Connection,
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
	onNodeChange,
	onTextGenerationContentChange,
	onDeleteConnection,
	userTier,
}: {
	node: TextGenerationNode;
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
			onNodeChange({
				outputs: node.outputs.filter((i) => i.accessor !== "source"),
			});
		},
		[node, connections, onNodeChange, onDeleteConnection],
	);

	const updateOutputForGoogle = useCallback(
		({
			urlContext,
			googleSearch,
		}: {
			urlContext: boolean;
			googleSearch: boolean;
		}) => {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (urlContext && googleSearch && sourceOutput) {
				return;
			}
			if ((urlContext || googleSearch) && sourceOutput) {
				return;
			}
			if ((urlContext || googleSearch) && !sourceOutput) {
				onNodeChange({
					outputs: [
						...node.outputs,
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
				outputs: node.outputs.filter((i) => i.accessor !== "source"),
			});
		},
		[onNodeChange, node.outputs, connections, onDeleteConnection],
	);

	const handleGoogleSearchGroundingChange = useCallback(
		(googleSearch: boolean) => {
			const result = GoogleLanguageModelData.safeParse(node.content.llm);
			if (result.error) {
				console.warn(
					`Error parsing GoogleLanguageModelData: ${node.content.llm}`,
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
		[node, onTextGenerationContentChange, updateOutputForGoogle],
	);

	const handleGoogleUrlContextChange = useCallback(
		(urlContext: boolean) => {
			const result = GoogleLanguageModelData.safeParse(node.content.llm);
			if (result.error) {
				console.warn(
					`Error parsing GoogleLanguageModelData: ${node.content.llm}`,
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
		[node, updateOutputForGoogle, onTextGenerationContentChange],
	);

	return (
		<>
			<div className="flex items-center justify-between gap-[12px]">
				<SettingDetail size="md">Model</SettingDetail>
				<ModelPickerV2 userTier={userTier} />
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
				{node.content.llm.provider === "google" && (
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
				)}
			</div>
		</>
	);
}
