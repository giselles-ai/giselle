import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import type { ImageGenerationNode } from "@giselles-ai/protocol";
import { useNodeGenerations, useWorkflowDesigner } from "@giselles-ai/react";
import { Minimize2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import {
	useElementTopPx,
	useLivePrompt,
	useOverlayBottom,
} from "../../../ui/hooks";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { GenerateCtaButton } from "../ui/generate-cta-button";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GenerationPanel } from "./generation-panel";
import { PromptPanel } from "./prompt-panel";
import { useConnectedSources } from "./sources";

export function ImageGenerationNodePropertiesPanel({
	node,
}: {
	node: ImageGenerationNode;
}) {
	const { data, updateNodeDataContent, updateNodeData, deleteNode } =
		useWorkflowDesigner();
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId: data.id },
		});
	const { all: connectedSources, connections } = useConnectedSources(node);
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();

	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isGenerationExpanded, setIsGenerationExpanded] = useState(false);
	const [editorVersion, setEditorVersion] = useState(0);
	const generateCtaRef = useRef<HTMLDivElement | null>(null);
	const promptEditorRef = useRef<HTMLDivElement | null>(null);
	const generationPanelRef = useRef<HTMLDivElement | null>(null);

	const _overlayBottomPx = useOverlayBottom(generateCtaRef);
	const promptTopPx = useElementTopPx(promptEditorRef);
	const generationTopPx = useElementTopPx(generationPanelRef);
	const livePrompt = useLivePrompt(node.id);

	useKeyboardShortcuts({
		onGenerate: () => {
			if (!isGenerating) {
				generateImage();
			}
		},
	});

	const generateImage = useCallback(() => {
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
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/image-node"
				onDelete={() => deleteNode(node.id)}
			/>

			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<div ref={promptEditorRef} className="mt-[12px]">
							<PromptPanel node={node} editorVersion={editorVersion} />
						</div>

						<div className="mt-[8px]" ref={generationPanelRef}>
							<SettingLabel className="mb-[4px]">Output</SettingLabel>
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateImage}
								onExpand={() => setIsGenerationExpanded(true)}
							/>
						</div>
					</div>

					<div
						ref={generateCtaRef}
						className="shrink-0 px-[16px] pt-[8px] pb-[4px]"
					>
						<GenerateCtaButton
							isGenerating={isGenerating}
							isEmpty={isPromptEmpty(node.content.prompt)}
							onClick={() => {
								if (isGenerating) stopGenerationRunner();
								else generateImage();
							}}
						/>
					</div>

					{/* Expanded prompt overlay */}
					<div
						role="dialog"
						aria-modal="true"
						aria-label="Expanded prompt editor"
						className={`absolute left-0 right-0 z-20 flex flex-col bg-background rounded-[8px] transition-all duration-300 ease-out ${
							isPromptExpanded
								? "opacity-100 scale-y-100 pointer-events-auto"
								: "opacity-0 scale-y-0 pointer-events-none"
						}`}
						style={{
							top: 0,
							bottom: _overlayBottomPx,
							paddingBottom: 12,
							transformOrigin: `center ${promptTopPx}px`,
						}}
					>
						<div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-[8px] bg-background">
							<PromptEditor
								key={`expanded-${editorVersion}-${node.id}`}
								value={livePrompt ?? node.content.prompt}
								onValueChange={(value) => {
									updateNodeDataContent(node, { prompt: value });
								}}
								connections={connections}
								placeholder="Write your prompt here..."
							/>
						</div>
						<div className="absolute bottom-[20px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize prompt editor"
								className="size-[32px] rounded-full bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] transition-colors flex items-center justify-center"
								onClick={() => {
									setIsPromptExpanded(false);
									setEditorVersion((v) => v + 1);
								}}
							>
								<Minimize2 className="size-[16px] text-inverse" />
							</button>
						</div>
						<button
							type="button"
							aria-label="Backdrop"
							className="absolute inset-0 -z-10"
							onClick={() => {
								setIsPromptExpanded(false);
								setEditorVersion((v) => v + 1);
							}}
						/>
					</div>

					{/* Expanded generation overlay */}
					<div
						role="dialog"
						aria-modal="true"
						aria-label="Expanded generation panel"
						className={`absolute left-0 right-0 z-20 flex flex-col bg-background rounded-[8px] transition-all duration-300 ease-out ${
							isGenerationExpanded
								? "opacity-100 scale-y-100 pointer-events-auto"
								: "opacity-0 scale-y-0 pointer-events-none"
						}`}
						style={{
							top: 0,
							bottom: _overlayBottomPx,
							paddingBottom: 12,
							transformOrigin: `center ${generationTopPx}px`,
						}}
					>
						<GenerationPanel
							node={node}
							onClickGenerateButton={generateImage}
							isExpanded={true}
						/>
						<div className="absolute bottom-[20px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize generation panel"
								className="size-[32px] rounded-full bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] transition-colors flex items-center justify-center"
								onClick={() => setIsGenerationExpanded(false)}
							>
								<Minimize2 className="size-[16px] text-inverse" />
							</button>
						</div>
						<button
							type="button"
							aria-label="Backdrop"
							className="absolute inset-0 -z-10"
							onClick={() => setIsGenerationExpanded(false)}
						/>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
