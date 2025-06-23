import type { ImageGenerationNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import { NodeIcon } from "../../../icons/node";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useNodeGeneration } from "../hooks/use-node-generation";
import { type TabConfig, TabbedPropertiesPanel } from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import { FalModelPanel, OpenAIImageModelPanel } from "./models";
import { PromptPanel } from "./prompt-panel";
import { useConnectedSources } from "./sources";

export function RefactoredImageGenerationNodePropertiesPanel({
	node,
}: {
	node: ImageGenerationNode;
}) {
	const { updateNodeDataContent, updateNodeData } = useWorkflowDesigner();
	const { all: connectedSources } = useConnectedSources(node);

	// Use shared generation hook
	const generation = useNodeGeneration({
		node,
		getConnectedSources: () => connectedSources,
		validateGeneration: () => {
			// Add validation logic if needed
			return true;
		},
	});

	// Model panel component based on provider
	const modelPanel = useMemo(() => {
		switch (node.content.llm.provider) {
			case "fal":
				return (
					<FalModelPanel
						languageModel={node.content.llm}
						onModelChange={(value) =>
							updateNodeDataContent(node, {
								...node.content,
								llm: value,
							})
						}
					/>
				);
			case "openai":
				return (
					<OpenAIImageModelPanel
						languageModel={node.content.llm}
						onModelChange={(value) =>
							updateNodeDataContent(node, {
								...node.content,
								llm: value,
							})
						}
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
			className: "overflow-y-auto",
		},
		{
			value: "input",
			label: "Input",
			content: <InputPanel node={node} />,
			className: "overflow-y-auto",
		},
	];

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
				icon={<NodeIcon node={node} className="size-[20px] text-black-900" />}
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
