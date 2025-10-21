import { useToasts } from "@giselle-internal/ui/toast";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { Button } from "../../../ui/button";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizeHandle,
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
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
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
					<Button
						loading={isGenerating}
						type="button"
						disabled={usageLimitsReached || isPromptEmpty(node.content.prompt)}
						onClick={() => {
							if (isGenerating) {
								stopGenerationRunner();
							} else {
								generateText();
							}
						}}
						className="w-[150px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isGenerating ? (
							<span>Stop</span>
						) : (
							<>
								<span>Generate</span>
								<kbd className="flex items-center text-[12px]">
									<CommandIcon className="size-[12px]" />
									<CornerDownLeft className="size-[12px]" />
								</kbd>
							</>
						)}
					</Button>
				}
			/>

			<PropertiesPanelContent>
				<PanelGroup direction="vertical" className="flex-1 flex flex-col">
					<Panel className="min-h-0 flex flex-col !overflow-y-auto p-[16px]">
						<TextGenerationTabContent node={node} />
					</Panel>
					<PanelResizeHandle className="h-[12px] flex items-center justify-center cursor-row-resize shrink-0">
						<ResizeHandle direction="vertical" />
					</PanelResizeHandle>
					<Panel className="min-h-0 flex flex-col !overflow-y-auto">
						<GenerationPanel node={node} onClickGenerateButton={generateText} />
					</Panel>
				</PanelGroup>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
