import type { QueryNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { DatabaseZapIcon } from "lucide-react";
import { useNodeGeneration } from "../hooks/use-node-generation";
import { type TabConfig, TabbedPropertiesPanel } from "../ui";
import { GenerationPanel } from "./generation-panel";
import { InputPanel } from "./input-panel";
import { QueryPanel } from "./query-panel";
import { useConnectedSources } from "./sources";

export function RefactoredQueryNodePropertiesPanel({
	node,
}: {
	node: QueryNode;
}) {
	const { updateNodeData } = useWorkflowDesigner();
	const { all: connectedSources } = useConnectedSources(node);

	// Use shared generation hook
	const generation = useNodeGeneration({
		node,
		getConnectedSources: () => connectedSources,
		validateGeneration: (node) => {
			// Add validation logic if needed
			return true;
		},
	});

	// Configure tabs
	const tabs: TabConfig[] = [
		{
			value: "query",
			label: "Query",
			content: <QueryPanel node={node} />,
			className: "overflow-hidden",
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
		<TabbedPropertiesPanel
			node={node}
			icon={<DatabaseZapIcon className="size-[20px] text-black-900" />}
			description="Query"
			onChangeName={(name) => updateNodeData(node, { name })}
			tabs={tabs}
			defaultTab="query"
			bottomPanel={bottomPanel}
			generationConfig={{
				isGenerating: generation.isGenerating,
				onGenerate: generation.handleGenerate,
				onStop: generation.handleStop,
				generateLabel: "Query",
				disabled: generation.disabled,
			}}
			enableKeyboardShortcuts={true}
		/>
	);
}
