import { useToasts } from "@giselle-internal/ui/toast";
import type { LanguageModelTier } from "@giselles-ai/language-model-registry";
import { convertContentGenerationToTextGeneration } from "@giselles-ai/node-registry";
import {
	type Connection,
	type ContentGenerationNode,
	Node,
	type NodeLike,
} from "@giselles-ai/protocol";
import { useNodeGenerations, useUsageLimits } from "@giselles-ai/react";
import { useCallback } from "react";
import { useAppDesignerStore } from "../../../app-designer/store/hooks";
import {
	useDeleteConnection,
	useDeleteNode,
	useUpdateNodeData,
	useUpdateNodeDataContent,
} from "../../../app-designer/store/usecases";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import { PropertiesPanelRoot } from "../ui";
import { GenerateCtaButton } from "../ui/generate-cta-button";
import { NodePanelHeader } from "../ui/node-panel-header";
import { PromptEditor } from "../ui/prompt-editor";
import { SettingLabel } from "../ui/setting-label";
import { AdvancedOptions } from "./advanced-options";
import { GenerationPanel } from "./generation-panel";
import { ModelSettings } from "./model";
import { useNodeContext } from "./node-context";

function isNode(nodeLike: NodeLike): nodeLike is Node {
	const result = Node.safeParse(nodeLike);
	return result.success;
}
export function TextGenerationNodePropertiesPanelV2({
	node,
}: {
	node: ContentGenerationNode;
}) {
	const textGenerationNode = convertContentGenerationToTextGeneration(node);
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const workspaceConnections = useAppDesignerStore((s) => s.connections);
	const updateNodeData = useUpdateNodeData();
	const updateNodeDataContent = useUpdateNodeDataContent();
	const deleteNode = useDeleteNode();
	const deleteConnection = useDeleteConnection();
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId },
		});
	const { connections } = useNodeContext(node);
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
				workspaceId,
			},
			operationNode: node,
			sourceNodes: connections
				.map((connection) => connection.outputNode)
				.filter((nodeLike) => isNode(nodeLike)),
			connections: workspaceConnections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		node,
		createAndStartGenerationRunner,
		usageLimitsReached,
		error,
		connections,
		workspaceConnections,
		workspaceId,
	]);

	const _handleDeleteConnection = useCallback(
		(connection: Connection) => {
			deleteConnection(connection.id);
		},
		[deleteConnection],
	);
	const usageLimits = useUsageLimits();
	const userTier: LanguageModelTier = usageLimits?.featureTier ?? "free";

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>

			{/*<PropertiesPanelContent>*/}
			<div className="grow-1 overflow-y-auto flex flex-col gap-[12px]">
				<ModelSettings
					node={node}
					onContentGenerationContentChange={(value) => {
						updateNodeDataContent(node, value);
					}}
					userTier={userTier}
				/>

				<SettingLabel>Prompt</SettingLabel>
				<PromptEditor
					placeholder="Write your prompt... Use @ to reference other nodes"
					value={node.content.prompt}
					onValueChange={(value: string) => {
						updateNodeDataContent(node, { prompt: value });
					}}
					connections={connections}
				/>
				<AdvancedOptions node={node} />
				<div className="flex flex-col gap-[4px]">
					<SettingLabel>Output</SettingLabel>
					<GenerationPanel textGenerationNode={textGenerationNode} />
				</div>
			</div>
			<div className="shrink-0 px-[16px] pt-[8px] pb-[4px]">
				<GenerateCtaButton
					isGenerating={isGenerating}
					isEmpty={isPromptEmpty(node.content.prompt)}
					onClick={() => {
						if (isGenerating) stopGenerationRunner();
						else generateText();
					}}
				/>
			</div>
			{/*</PropertiesPanelContent>*/}
		</PropertiesPanelRoot>
	);
}
