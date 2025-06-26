import {
	type Output,
	OutputId,
	type TextGenerationNode,
	type ToolSet,
	isImageGenerationNode,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import clsx from "clsx/lite";
import {
	useFeatureFlag,
	useNodeGenerations,
	useWorkflowDesigner,
} from "giselle-sdk/react";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import {
	AnthropicIcon,
	GoogleIcon,
	OpenaiIcon,
	PerplexityIcon,
} from "../../../icons";
import { Button } from "../../../ui/button";
import { useToasts } from "../../../ui/toast";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { KeyboardShortcuts } from "../../components/keyboard-shortcuts";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizableSection,
	ResizableSectionGroup,
	ResizableSectionHandle,
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
	const {
		data,
		updateNodeDataContent,
		updateNodeData,
		setUiNodeState,
		deleteConnection,
	} = useWorkflowDesigner();
	const { createAndStartGeneration, isGenerating, stopGeneration } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "workspace", id: data.id },
		});
	const { all: connectedSources } = useConnectedOutputs(node);
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();
	const { layoutV2 } = useFeatureFlag();

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	const generateText = useCallback(() => {
		if (usageLimitsReached) {
			error("Please upgrade your plan to continue using this feature.");
			return;
		}

		createAndStartGeneration({
			origin: {
				type: "workspace",
				id: data.id,
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
		createAndStartGeneration,
		usageLimitsReached,
		error,
	]);

	const jsonOrText = node.content.prompt;
	const text = isJsonContent(jsonOrText)
		? jsonContentToText(JSON.parse(jsonOrText))
		: jsonOrText;
	const noWhitespaceText = text?.replace(/[\s\u3000]+/g, "");
	const disabled = usageLimitsReached || !noWhitespaceText;
	const { githubTools, sidemenu } = useFeatureFlag();

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<PropertiesPanelHeader
				icon={
					<>
						{node.content.llm.provider === "openai" && (
							<OpenaiIcon className="size-[20px] text-black-900" />
						)}
						{node.content.llm.provider === "anthropic" && (
							<AnthropicIcon className="size-[20px] text-black-900" />
						)}
						{node.content.llm.provider === "google" && (
							<GoogleIcon className="size-[20px]" />
						)}
						{node.content.llm.provider === "perplexity" && (
							<PerplexityIcon className="size-[20px] text-black-900" />
						)}
					</>
				}
				node={node}
				description={node.content.llm.provider}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						loading={isGenerating}
						type="button"
						disabled={disabled}
						onClick={() => {
							if (isGenerating) {
								stopGeneration();
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
				{layoutV2 ? (
					<PanelGroup direction="vertical" className="flex-1 flex flex-col">
						<Panel>
							<PropertiesPanelContent>
								<TextGenerationTabContent
									node={node}
									uiState={uiState}
									setUiNodeState={setUiNodeState}
									updateNodeDataContent={updateNodeDataContent}
									updateNodeData={updateNodeData}
									data={data}
									deleteConnection={deleteConnection}
									githubTools={githubTools}
									sidemenu={sidemenu}
								/>
							</PropertiesPanelContent>
						</Panel>
						<PanelResizeHandle className="h-[12px] flex items-center justify-center cursor-row-resize">
							<ResizeHandle direction="vertical" />
						</PanelResizeHandle>
						<Panel>
							<PropertiesPanelContent>
								<GenerationPanel
									node={node}
									onClickGenerateButton={generateText}
								/>
							</PropertiesPanelContent>
						</Panel>
					</PanelGroup>
				) : (
					<ResizableSectionGroup>
						<ResizableSection
							title="Configuration"
							defaultSize={70}
							minSize={30}
						>
							<div className="p-4">
								<TextGenerationTabContent
									node={node}
									uiState={uiState}
									setUiNodeState={setUiNodeState}
									updateNodeDataContent={updateNodeDataContent}
									updateNodeData={updateNodeData}
									data={data}
									deleteConnection={deleteConnection}
									githubTools={githubTools}
									sidemenu={sidemenu}
								/>
							</div>
						</ResizableSection>
						<ResizableSectionHandle />
						<ResizableSection title="Generation" defaultSize={30}>
							<div className="p-4">
								<GenerationPanel
									node={node}
									onClickGenerateButton={generateText}
								/>
							</div>
						</ResizableSection>
					</ResizableSectionGroup>
				)}
			</PropertiesPanelContent>
			<KeyboardShortcuts
				generate={() => {
					if (!isGenerating) {
						generateText();
					}
				}}
			/>
		</PropertiesPanelRoot>
	);
}
