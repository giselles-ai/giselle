import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	useNodeGenerations,
	useWorkflowDesigner,
	useWorkflowDesignerStore,
} from "@giselles-ai/giselle/react";
import type { TextGenerationNode } from "@giselles-ai/protocol";
import { Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useConnectedOutputs } from "./outputs";
import { TextGenerationTabContent } from "./tab-content";

export function TextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { data, updateNodeData, deleteNode } = useWorkflowDesigner();
	const captureOpts: AddEventListenerOptions = { capture: true };
	const updateNodeDataContent = useWorkflowDesignerStore(
		(s) => s.updateNodeDataContent,
	);
	const {
		createAndStartGenerationRunner,
		isGenerating,
		stopGenerationRunner,
		currentGeneration,
	} = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});
	const { all: connectedSources } = useConnectedOutputs(node);
	const sourceNodes = useMemo(
		() => connectedSources.map((c) => c.node),
		[connectedSources],
	);
	const connectedOutputs = useMemo(
		() =>
			connectedSources.map(({ node: n, id, label, accessor }) => ({
				node: n,
				output: { id, label, accessor },
			})),
		[connectedSources],
	);
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isGenerationExpanded, setIsGenerationExpanded] = useState(false);
	const [editorVersion, setEditorVersion] = useState(0);
	const generateCtaRef = useRef<HTMLDivElement | null>(null);
	const _overlayBottomPx = useOverlayBottom(
		generateCtaRef as React.RefObject<HTMLDivElement>,
	);
	const promptEditorRef = useRef<HTMLDivElement | null>(null);
	const generationPanelRef = useRef<HTMLDivElement | null>(null);
	const promptTopPx = useElementTopPx(
		promptEditorRef as React.RefObject<HTMLDivElement>,
	);
	const generationTopPx = useElementTopPx(
		generationPanelRef as React.RefObject<HTMLDivElement>,
	);
	const usageLimitsReached = useUsageLimitsReached();
	// Subscribe live to the latest prompt value so expanded editor always reflects current content
	const livePrompt = useLivePrompt(node.id);
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
			if (isPromptExpanded && e.key === "Escape") {
				e.stopPropagation();
				setIsPromptExpanded(false);
				setEditorVersion((v) => v + 1);
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				generateText();
			}
		};
		window.addEventListener("keydown", onKeydown, captureOpts);
		return () => window.removeEventListener("keydown", onKeydown, captureOpts);
	}, [isPromptExpanded, generateText]);

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
						<div ref={promptEditorRef}>
							<TextGenerationTabContent
								node={node}
								onPromptExpand={() => {
									// Remount editor to take latest content (TipTap is not controlled)
									setEditorVersion((v) => v + 1);
									requestAnimationFrame(() => setIsPromptExpanded(true));
								}}
								editorVersion={editorVersion}
							/>
						</div>
						<div className="mt-[8px]">
							<SettingLabel className="mb-[4px]">Output</SettingLabel>
							<div ref={generationPanelRef}>
								<GenerationPanel
									node={node}
									onClickGenerateButton={generateText}
									onExpand={() => {
										setIsGenerationExpanded(true);
									}}
								/>
							</div>
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
								else generateText();
							}}
						/>
					</div>
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
								nodes={sourceNodes}
								connectedSources={connectedOutputs}
								placeholder="Write your prompt here..."
								showToolbar={false}
								variant="plain"
								showExpandIcon={false}
								containerClassName="flex-1 min-h-0 h-full"
								editorClassName="h-full min-h-0 overflow-y-auto"
								minHeightClass=""
								fullHeight
							/>
						</div>
						<div className="absolute bottom-[20px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize prompt editor"
								className="size-[32px] rounded-full bg-[var(--color-text-inverse, #fff)] hover:bg-[color-mix(in_srgb,var(--color-text-inverse, #fff)_80%,transparent)] transition-colors flex items-center justify-center"
								onClick={() => {
									setIsPromptExpanded(false);
									setEditorVersion((v) => v + 1);
								}}
							>
								<Minimize2 className="size-[16px] text-background" />
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
						{currentGeneration && (
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateText}
								isExpanded={true}
							/>
						)}
						<div className="absolute bottom-[20px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize generation panel"
								className="size-[32px] rounded-full bg-[var(--color-text-inverse, #fff)] hover:bg-[color-mix(in_srgb,var(--color-text-inverse, #fff)_80%,transparent)] transition-colors flex items-center justify-center"
								onClick={() => {
									setIsGenerationExpanded(false);
								}}
							>
								<Minimize2 className="size-[16px] text-background" />
							</button>
						</div>
						<button
							type="button"
							aria-label="Backdrop"
							className="absolute inset-0 -z-10"
							onClick={() => {
								setIsGenerationExpanded(false);
							}}
						/>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
