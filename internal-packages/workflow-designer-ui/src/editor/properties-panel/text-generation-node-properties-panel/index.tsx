import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import type { TextGenerationNode } from "@giselles-ai/protocol";
import { useNodeGenerations, useWorkflowDesigner } from "@giselles-ai/react";
import { useCallback, useEffect, useMemo } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { GenerateCtaButton } from "../ui/generate-cta-button";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GenerationPanel } from "./generation-panel";
import { useConnectedOutputs } from "./outputs";
import { TextGenerationTabContent } from "./tab-content";

export function TextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { data, updateNodeData, deleteNode } = useWorkflowDesigner();
	const captureOpts: AddEventListenerOptions = { capture: true };
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId: data.id },
		});
	const { all: connectedSources } = useConnectedOutputs(node);
	const sourceNodes = useMemo(
		() => connectedSources.map((c) => c.node),
		[connectedSources],
	);
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
			sourceNodes,
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		sourceNodes,
		data.id,
		data.connections,
		node,
		createAndStartGenerationRunner,
		usageLimitsReached,
		error,
	]);

	useEffect(() => {
		const onKeydown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				generateText();
			}
		};
		window.addEventListener("keydown", onKeydown, captureOpts);
		return () => window.removeEventListener("keydown", onKeydown, captureOpts);
	}, [generateText]);

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>

			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<TextGenerationTabContent node={node} />
						<div className="mt-[8px]">
							<SettingLabel className="mb-[4px]">Output</SettingLabel>
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateText}
							/>
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
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
