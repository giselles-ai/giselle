import { IconBox } from "@giselle-internal/ui/icon-box";
import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { Trash2 as TrashIcon } from "lucide-react";
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
	const { data, updateNodeData, deleteNode } = useWorkflowDesigner();
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
				action={
					<div className="flex items-center gap-[6px]">
						<IconBox
							aria-label="Open documentation"
							title="Open documentation"
							onClick={() =>
								window.open(
									"https://docs.giselles.ai",
									"_blank",
									"noopener,noreferrer",
								)
							}
						>
							<svg
								className="size-[14px]"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="External link"
							>
								<path
									d="M14 3h7v7m0-7L10 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</IconBox>
						<IconBox
							aria-label="Delete node"
							title="Delete node"
							onClick={() => deleteNode(node.id)}
						>
							<TrashIcon className="size-[14px]" />
						</IconBox>
					</div>
				}
			/>

			<PropertiesPanelContent>
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<TextGenerationTabContent node={node} />
						<div className="mt-[8px]">
							<SettingLabel className="mb-[4px]">Output</SettingLabel>
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateText}
								onExpand={() => {
									console.log("Expand generation panel");
								}}
							/>
						</div>
					</div>
					{currentGeneration === undefined && (
						<div className="shrink-0 px-[16px] pt-[8px] pb-[4px] bg-gradient-to-t from-bg via-bg/80 to-transparent">
							<button
								type="button"
								onClick={() => {
									generateText();
								}}
								className="w-full flex items-center justify-center px-[24px] py-[12px] bg-[#141519] text-white rounded-[9999px] border border-border/15 transition-all hover:bg-[#1e1f26] hover:border-border/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px] whitespace-nowrap"
							>
								<span className="mr-[8px] generate-star">✦</span>
								Generate with the Current Prompt
								<span className="ml-[8px] flex items-center gap-[2px] text-[11px] text-white/40">
									<kbd className="px-[4px] py-[1px] bg-white/10 rounded-[4px]">⌘</kbd>
									<kbd className="px-[4px] py-[1px] bg-white/10 rounded-[4px]">↵</kbd>
								</span>
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
						</div>
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
