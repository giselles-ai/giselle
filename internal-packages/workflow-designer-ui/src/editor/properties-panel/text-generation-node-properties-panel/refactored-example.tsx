import {
	type AnthropicLanguageModelData,
	type GoogleLanguageModelData,
	type OpenAILanguageModelData,
	type PerplexityLanguageModelData,
	type TextGenerationNode,
	isImageGenerationNode,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { useFeatureFlag, useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import {
	AnthropicIcon,
	GoogleIcon,
	OpenaiIcon,
	PerplexityIcon,
} from "../../../icons";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useNodeGeneration } from "../hooks/use-node-generation";
import { type TabConfig, TabbedPropertiesPanel } from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import {
	AnthropicModelPanel,
	GoogleModelPanel,
	OpenAIModelPanel,
	PerplexityModelPanel,
} from "./model";
import { useConnectedOutputs } from "./outputs";
import { PromptPanel } from "./prompt-panel";
import { GitHubToolsPanel, PostgresToolsPanel, ToolsPanel } from "./tools";

export function RefactoredTextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { data, updateNodeDataContent, updateNodeData, deleteConnection } =
		useWorkflowDesigner();
	const { all: connectedSources } = useConnectedOutputs(node);
	const { githubTools, sidemenu } = useFeatureFlag();

	// Use shared generation hook
	const generation = useNodeGeneration({
		node,
		getConnectedSources: () => connectedSources,
		validateGeneration: (node) => {
			const text = node.content.prompt;
			const noWhitespaceText = text?.replace(/[\s\u3000]+/g, "");
			return !!noWhitespaceText;
		},
	});

	// Provider-specific icon
	const providerIcon = useMemo(() => {
		switch (node.content.llm.provider) {
			case "openai":
				return <OpenaiIcon className="size-[20px] text-black-900" />;
			case "anthropic":
				return <AnthropicIcon className="size-[20px] text-black-900" />;
			case "google":
				return <GoogleIcon className="size-[20px]" />;
			case "perplexity":
				return <PerplexityIcon className="size-[20px] text-black-900" />;
			default:
				return null;
		}
	}, [node.content.llm.provider]);

	// Model panel component based on provider
	const modelPanel = useMemo(() => {
		const commonProps = {
			onModelChange: (
				value:
					| OpenAILanguageModelData
					| AnthropicLanguageModelData
					| GoogleLanguageModelData
					| PerplexityLanguageModelData,
			) =>
				updateNodeDataContent(node, {
					...node.content,
					llm: value,
				}),
		};

		switch (node.content.llm.provider) {
			case "openai":
				return (
					<OpenAIModelPanel
						openaiLanguageModel={node.content.llm}
						tools={node.content.tools}
						{...commonProps}
						onToolChange={(changedTool) =>
							updateNodeDataContent(node, {
								...node.content,
								tools: changedTool,
							})
						}
						onWebSearchChange={(enable) => {
							// ... existing web search logic
						}}
					/>
				);
			case "google":
				return (
					<GoogleModelPanel
						googleLanguageModel={node.content.llm}
						{...commonProps}
						onSearchGroundingConfigurationChange={(enable) => {
							// ... existing search grounding logic
						}}
					/>
				);
			case "anthropic":
				return (
					<AnthropicModelPanel
						anthropicLanguageModel={node.content.llm}
						{...commonProps}
					/>
				);
			case "perplexity":
				return (
					<PerplexityModelPanel
						perplexityLanguageModel={node.content.llm}
						{...commonProps}
					/>
				);
			default:
				return null;
		}
	}, [node, updateNodeDataContent]);

	// Configure tabs
	const tabs: TabConfig[] = [
		{
			value: "prompt",
			label: "Prompt",
			content: <PromptPanel node={node} />,
			className: "overflow-hidden",
		},
		{
			value: "model",
			label: "Model",
			content: modelPanel,
			className: "overflow-y-auto px-[4px]",
		},
		{
			value: "input",
			label: "Input",
			content: <InputPanel node={node} />,
			className: "overflow-y-auto",
		},
	];

	// Add tools tab if feature is enabled
	if (githubTools) {
		tabs.push({
			value: "tools",
			label: "Tools",
			content: sidemenu ? (
				<ToolsPanel node={node} />
			) : (
				<div className="p-[8px]">
					<GitHubToolsPanel node={node} />
					<PostgresToolsPanel node={node} />
				</div>
			),
			className: "overflow-y-auto p-[4px] gap-[16px]",
		});
	}

	// Bottom panel (generation results)
	const bottomPanel = (
		<GenerationPanel
			node={node}
			onClickGenerateButton={generation.handleGenerate}
		/>
	);

	return (
		<>
			{generation.disabled && <UsageLimitWarning />}
			<TabbedPropertiesPanel
				node={node}
				icon={providerIcon}
				description={node.content.llm.provider}
				onChangeName={(name) => updateNodeData(node, { name })}
				tabs={tabs}
				defaultTab="prompt"
				bottomPanel={bottomPanel}
				generationConfig={{
					isGenerating: generation.isGenerating,
					onGenerate: generation.handleGenerate,
					onStop: generation.handleStop,
					generateLabel: "Generate",
					disabled: generation.disabled,
				}}
				enableKeyboardShortcuts={true}
			/>
		</>
	);
}
