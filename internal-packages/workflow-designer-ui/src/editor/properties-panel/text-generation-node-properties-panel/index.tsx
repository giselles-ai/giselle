import { useToasts } from "@giselle-internal/ui/toast";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
// Removed header Generate button; icons no longer needed
import { useCallback } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
// import { Button } from "../../../ui/button";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { useConnectedOutputs } from "./outputs";
import { TextGenerationTabContent } from "./tab-content";

export function TextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { data, updateNodeData } = useWorkflowDesigner();
	const {
		createAndStartGenerationRunner,
		isGenerating,
		// stopGenerationRunner,
		currentGeneration,
	} = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});
	const { all: connectedSources } = useConnectedOutputs(node);
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
			sourceNodes: connectedSources.map(
				(connectedSource) => connectedSource.node,
			),
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		connectedSources,
		data.id,
		data.connections,
		node,
		createAndStartGenerationRunner,
		usageLimitsReached,
		error,
	]);

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<PropertiesPanelHeader
				node={node}
				description={node.content.llm.provider}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>

			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0">
					<div className="overflow-y-auto flex-1 min-h-0">
						<TextGenerationTabContent node={node} />
						<div className="mt-[8px]">
							<div className="text-text text-[12px] mb-[4px]">Output</div>
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateText}
							/>
						</div>
					</div>
					{currentGeneration === undefined && (
						<button
							type="button"
							onClick={() => {
								generateText();
							}}
							className="absolute bottom-[16px] left-1/2 -translate-x-1/2 z-20 flex items-center justify-center px-[24px] py-[12px] bg-[#141519] text-white rounded-[9999px] border border-border/15 transition-all hover:bg-[#1e1f26] hover:border-border/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px]"
						>
							<span className="mr-[8px] generate-star">✦</span>
							Generate with the Current Prompt
							<style jsx>{`
								.generate-star { display: inline-block; }
								button:hover .generate-star { animation: rotateStar 0.7s ease-in-out; }
								@keyframes rotateStar {
									0% { transform: rotate(0deg) scale(1); }
									50% { transform: rotate(180deg) scale(1.5); }
									100% { transform: rotate(360deg) scale(1); }
								}
							`}</style>
						</button>
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
